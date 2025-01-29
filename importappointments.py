import os
import json
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import subprocess
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_appointments(username, password):
    """
    Logs in with the given credentials, scrapes appointments, and returns them as a list of dicts.
    """
    rows = []
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # 1. Navigate to login page
        driver.get("https://v3.lifesaferplus.com/UserLogin.aspx")
        
        # 2. Login
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "ctl00_PageContentPlaceHolder_txtUserName"))
        ).send_keys(username)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_txtPassword").send_keys(password)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_cmdLogin").click()
        
        # 3. Wait for the login to process
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
        
        # 6. Find the table and rows
        table = soup.find("table", {"align": "left"})
        if not table:
            logging.warning("Appointments table not found.")
            return rows
        
        table_rows = table.find_all('tr', class_=['TableRowMain', 'TableRowAlt'])
        for row in table_rows:
            columns = row.find_all('td')
            if len(columns) >= 8:
                appointment_time_cell = columns[1]
                completed = False
                
                # Check for the <div style="text-decoration: line-through;">
                appointment_div = appointment_time_cell.find('div')
                if appointment_div and 'style' in appointment_div.attrs:
                    style = appointment_div['style'].lower()
                    if 'line-through' in style:
                        completed = True
                
                # Extract the appointment time text
                appointment_time = appointment_time_cell.get_text(strip=True)
                
                if '-' in appointment_time:
                    appointment_time = appointment_time.split('-')[0].strip()
                else:
                    appointment_time = appointment_time.strip()
    
                # Sanitize the client name (extract last name only)
                client_full = columns[4].get_text(strip=True)
    
                if ',' in client_full:
                    # Extract last name from "Last, First" format
                    client_last_name = client_full.split(',')[0].strip()
                else:
                    # Extract last name from "First Last" format
                    client_last_name = client_full.split(' ')[-1].split('(')[0].strip()
    
                # Extract the firmware version
                firmware_raw = columns[7].get_text(strip=True)
                logging.debug(f"Extracted Firmware: '{firmware_raw}' (repr: {repr(firmware_raw)})")
                # Clean up hidden characters and spaces
                firmware_clean = firmware_raw.replace('\xa0', ' ').strip()
                if '(camera)' in firmware_clean.lower():
                    firmware = 'Legacy'
                else:
                    firmware = 'L250'
                
                rows.append({
                    'Location': columns[0].get_text(strip=True),
                    'Appointment Time': appointment_time,
                    'Service': columns[3].get_text(strip=True),
                    'Client': client_last_name,
                    'Vehicle': columns[6].get_text(strip=True),
                    'Firmware': firmware,
                    'Completed': completed
                })
    except Exception as e:
        logging.error("An error occurred during scraping.", exc_info=True)
    finally:
        driver.quit()
    
    return rows

def git_push():
    try:
        subprocess.run(["git", "add", "appointments.json"], check=True)
        commit_message = f"Auto-update appointments on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.run(["git", "commit", "-m", commit_message], check=True)
        subprocess.run(["git", "push"], check=True)
        logging.info("Changes pushed to repository.")
    except subprocess.CalledProcessError as e:
        logging.error("Error in Git operations:", exc_info=True)

def main():
    # Grab all environment variables
    LIFESAFER_USERNAME = os.getenv('LIFESAFER_USERNAME')
    LIFESAFER_PASSWORD = os.getenv('LIFESAFER_PASSWORD')
    GUARDIAN_USERNAME = os.getenv('GUARDIAN_USERNAME')
    GUARDIAN_PASSWORD = os.getenv('GUARDIAN_PASSWORD')
    
    # Ensure none of them are empty
    if not all([LIFESAFER_USERNAME, LIFESAFER_PASSWORD, GUARDIAN_USERNAME, GUARDIAN_PASSWORD]):
        raise ValueError("Environment variables for Lifesafer & Guardian credentials must all be set.")
    
    # 1. Scrape Lifesafer
    logging.info("Scraping Lifesafer appointments...")
    lifesafer_data = scrape_appointments(LIFESAFER_USERNAME, LIFESAFER_PASSWORD)
    
    # 2. Scrape Guardian
    logging.info("Scraping Guardian appointments...")
    guardian_data = scrape_appointments(GUARDIAN_USERNAME, GUARDIAN_PASSWORD)
    
    # Combine into one JSON structure
    combined_data = {
        "lifesafer": lifesafer_data,
        "guardian": guardian_data
    }
    
    # Write to local JSON
    output_path = 'appointments.json'
    try:
        with open(output_path, 'w') as f:
            json.dump(combined_data, f, indent=4)
        logging.info(f"Updated {output_path}")
    except IOError as e:
        logging.error(f"Failed to write to {output_path}", exc_info=True)
    
    # Uncomment and adjust the following block if writing to GitHub path is needed
    """
    try:
        output_github_path = '../interlockgo/appointments.json'  # Adjust path if needed
        with open(output_github_path, 'w') as f:
            json.dump(combined_data, f, indent=4)
        logging.info(f"Updated {output_github_path}")
    except IOError as e:
        logging.error(f"Failed to write to {output_github_path}", exc_info=True)
    """
    
    # Optionally print the data
    logging.debug(json.dumps(combined_data, indent=4))
    
    # Push changes to Git
    git_push()

if __name__ == "__main__":
    main()