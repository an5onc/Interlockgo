import os
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup

def scrape_appointments(username, password):
    """
    Logs in with the given credentials, scrapes appointments, and returns them as a list of dicts.
    """
    rows = []
    driver = webdriver.Chrome()  # Ensure the ChromeDriver is installed and on your PATH
    
    try:
        # 1. Navigate to login page
        driver.get("https://v3.lifesaferplus.com/UserLogin.aspx")
        
        # 2. Login
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_txtUserName").send_keys(username)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_txtPassword").send_keys(password)
        driver.find_element(By.ID, "ctl00_PageContentPlaceHolder_cmdLogin").click()
        
        # 3. Wait for the login to process
        time.sleep(3)  # Adjust if needed
        
        # 4. Navigate to the appointments page
        driver.get("https://v3.lifesaferplus.com/ApptDailyListing.aspx")
        time.sleep(2)  # Allow time for the table to load
        
        # 5. Parse the page with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # 6. Find the table and rows
        table = soup.find("table", {"align": "left"})
        if table:
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
                    firm_ware = columns[7].get_text(strip=True)
                    # Debugging Output: Print extracted firmware and its raw representation
                    print(f"Extracted Firmware: '{firm_ware}' (repr: {repr(firm_ware)})")
                    # Clean up hidden characters and spaces
                    firm_ware = firm_ware.replace('\xa0', ' ').strip()
                    if '(camera)' in firm_ware.lower():
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
    finally:
        driver.quit()
    
    return rows

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
    lifesafer_data = scrape_appointments(LIFESAFER_USERNAME, LIFESAFER_PASSWORD)
    
    # 2. Scrape Guardian
    guardian_data = scrape_appointments(GUARDIAN_USERNAME, GUARDIAN_PASSWORD)
    
    # Combine into one JSON structure
    combined_data = {
        "lifesafer": lifesafer_data,
        "guardian": guardian_data
    }
    
    # Write to local JSON
    output_path = 'appointments.json'
    with open(output_path, 'w') as f:
        json.dump(combined_data, f, indent=4)
    
    """Write to GitHub JSON
    output_github_path = '../interlockgo/appointments.json'  # Adjust path if needed
    with open(output_github_path, 'w') as f:
        json.dump(combined_data, f, indent=4)"""
    
    print("Updated appointments.json")
    print(json.dumps(combined_data, indent=4))

if __name__ == "__main__":
    main()