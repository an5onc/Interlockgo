import os, sys
import json
import logging
import subprocess
import shutil
from datetime import datetime
import time  # Needed for scheduling loop
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from typing import Optional

try:
    from dotenv import load_dotenv  # pip install python-dotenv
except Exception:
    load_dotenv = None

def get_env(name: str) -> Optional[str]:
    """
    Resolve env var from:
      1) process env
      2) .env via python-dotenv (if installed and .env exists)
      3) Windows registry (User and System Environment) so `setx` works without reopening shell
    """
    # 1) process env
    val = os.getenv(name)
    if val:
        return val

    # 2) .env
    if load_dotenv is not None and os.path.exists(".env"):
        load_dotenv(override=False)
        val = os.getenv(name)
        if val:
            return val

    # 3) Windows registry (no effect on non-Windows)
    if os.name == "nt":
        try:
            import winreg
            # User env
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as k:
                try:
                    v, _ = winreg.QueryValueEx(k, name)
                    if v:
                        return v
                except FileNotFoundError:
                    pass
            # System env
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as k:
                try:
                    v, _ = winreg.QueryValueEx(k, name)
                    if v:
                        return v
                except FileNotFoundError:
                    pass
        except Exception:
            # don't crash if winreg unavailable or access denied
            pass

    return None

def require_creds(*names: str):
    missing = [n for n in names if not get_env(n)]
    if missing:
        raise ValueError(f"Missing required credentials: {', '.join(missing)}")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def scrape_appointments(username, password, source='lifesafer'):
    """
    Logs in with the given credentials, scrapes appointments, and returns them as a list of dictionaries.
    source: 'lifesafer' or 'guardian' — controls handset logic.
    """
    rows = []
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 1. Navigate to login page
        driver.get("https://v3.lifesaferplus.com/UserLogin.aspx")
        
        # 2. Perform login
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "ctl00_PageContentPlaceHolder_txtUserName"))
        ).send_keys(username)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_txtPassword").send_keys(password)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_cmdLogin").click()
        
        # 3. Wait for the login to process (URL change)
        WebDriverWait(driver, 10).until(
            EC.url_changes("https://v3.lifesaferplus.com/UserLogin.aspx")
        )
        
        # 4. Navigate to the appointments page
        driver.get("https://v3.lifesaferplus.com/ApptDailyListing.aspx")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )
        
        # 5. Parse the page with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # 6. Find the appointments table
        table = soup.find("table", {"align": "left"})
        if not table:
            logging.warning("Appointments table not found.")
            return rows
        
        # Find table rows with the expected classes
        table_rows = table.find_all('tr', class_=['TableRowMain', 'TableRowAlt'])
        for row in table_rows:
            columns = row.find_all('td')
            if len(columns) >= 8:
                # Process appointment time cell
                appointment_time_cell = columns[1]
                completed = False
                appointment_div = appointment_time_cell.find('div')
                if appointment_div and 'style' in appointment_div.attrs:
                    if 'line-through' in appointment_div['style'].lower():
                        completed = True

                # Extract and sanitize appointment time text
                appointment_time = appointment_time_cell.get_text(strip=True)
                if '-' in appointment_time:
                    appointment_time = appointment_time.split('-')[0].strip()
                else:
                    appointment_time = appointment_time.strip()
    
                # Extract client initials as "F.L." (first letter of first name + first letter of last name with periods)
                client_full = columns[4].get_text(strip=True)
                if ',' in client_full:
                    # Format: "LastName, FirstName"
                    parts = [p.strip() for p in client_full.split(',')]
                    last_init = parts[0][0].upper() if parts[0] else '?'
                    first_init = parts[1][0].upper() if len(parts) > 1 and parts[1] else '?'
                    client_initials = f"{first_init}.{last_init}."
                else:
                    # Format: "FirstName LastName" or single name
                    words = client_full.strip().split()
                    if len(words) >= 2:
                        client_initials = f"{words[0][0].upper()}.{words[-1][0].upper()}."
                    elif words:
                        client_initials = f"{words[0][0].upper()}."
                    else:
                        client_initials = '?'
    
                # Determine handset type
                if source == 'guardian':
                    handset = 'AMS2500'
                else:
                    # Lifesafer: "111" means LS250, anything else is LC100
                    firmware_raw = columns[7].get_text(strip=True).replace('\xa0', ' ').strip()
                    handset = 'LS250' if firmware_raw == '111' else 'LC100'
    
                rows.append({
                    'Location': columns[0].get_text(strip=True),
                    'Appointment Time': appointment_time,
                    'Service': columns[3].get_text(strip=True),
                    'Client': client_initials,
                    'Vehicle': columns[6].get_text(strip=True),
                    'Handset': handset,
                    'Completed': completed
                })
    except Exception as e:
        logging.error("An error occurred during scraping.", exc_info=True)
    finally:
        driver.quit()
    
    return rows


def git_push():
    """
    Stages, commits, and pushes changes to the Git repository.
    Checks for staged changes before committing.
    """
    try:
        # Find full path to git
        git_path = shutil.which("git")
        if not git_path:
            logging.error("Git is not installed or not found in PATH.")
            return

        # Add the appointments.json file
        subprocess.run([git_path, "add", "appointments.json"], check=True)  # nosec

        # Prepare the commit message with timestamp
        commit_message = f"Auto-update appointments on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Check if there are any staged changes
        diff_check = subprocess.run([git_path, "diff", "--cached", "--quiet"])
        if diff_check.returncode == 1:
            # There are changes; commit them.
            subprocess.run([git_path, "commit", "-m", commit_message], check=True)  # nosec
            logging.info("Changes committed to repository.")
        else:
            logging.info("No changes to commit.")

        # Push changes (this is safe even if nothing new was committed)
        subprocess.run([git_path, "push"], check=True)  # nosec
        logging.info("Changes pushed to repository.")
        
    except subprocess.CalledProcessError as e:
        logging.error("Error in Git operations:", exc_info=True)


def main():
    # Resolve credentials robustly
    LIFESAFER_USERNAME = get_env('LIFESAFER_USERNAME')
    LIFESAFER_PASSWORD = get_env('LIFESAFER_PASSWORD')
    GUARDIAN_USERNAME  = get_env('GUARDIAN_USERNAME')
    GUARDIAN_PASSWORD  = get_env('GUARDIAN_PASSWORD')

    require_creds('LIFESAFER_USERNAME','LIFESAFER_PASSWORD','GUARDIAN_USERNAME','GUARDIAN_PASSWORD')

    
    # Ensure all credentials are set
    if not all([LIFESAFER_USERNAME, LIFESAFER_PASSWORD, GUARDIAN_USERNAME, GUARDIAN_PASSWORD]):
        raise ValueError("Environment variables for Lifesafer & Guardian credentials must all be set.")
    
    # 1. Scrape Lifesafer appointments
    logging.info("Scraping Lifesafer appointments...")
    lifesafer_data = scrape_appointments(LIFESAFER_USERNAME, LIFESAFER_PASSWORD, source='lifesafer')
    
    # 2. Scrape Guardian appointments
    logging.info("Scraping Guardian appointments...")
    guardian_data = scrape_appointments(GUARDIAN_USERNAME, GUARDIAN_PASSWORD, source='guardian')
    
    # Combine the data into one JSON structure
    combined_data = {
        "lifesafer": lifesafer_data,
        "guardian": guardian_data
    }
    
    # Write the combined data to appointments.json
    output_path = 'appointments.json'
    try:
        with open(output_path, 'w') as f:
            json.dump(combined_data, f, indent=4)
        logging.info(f"Updated {output_path}")
    except IOError as e:
        logging.error(f"Failed to write to {output_path}", exc_info=True)
    
    # Optionally, print the data for debugging
    logging.debug(json.dumps(combined_data, indent=4))
    
    # Push changes to Git
    git_push()


def schedule_jobs():
    """
    Schedules the main() function to run at 8am, noon, 4pm, and 10pm every day.
    Note: The computer (or at least this script) must be running continuously for the scheduler to work.
    """
    try:
        import schedule  # Ensure you have installed schedule via pip
    except ImportError:
        logging.error("The 'schedule' module is not installed. Install it with 'pip install schedule'")
        return
    
    # Schedule main() to run at specified times
    schedule.every().day.at("08:00").do(main)
    schedule.every().day.at("12:00").do(main)
    schedule.every().day.at("16:00").do(main)
    schedule.every().day.at("22:00").do(main)
    
    logging.info("Scheduled jobs set for 08:00, 12:00, 16:00, and 22:00 daily.")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every 60 seconds


if __name__ == "__main__":
    import sys
    # If the script is called with "schedule" as an argument, run the scheduler.
    if len(sys.argv) > 1 and sys.argv[1].lower() == "schedule":
        schedule_jobs()
    else:
        main()