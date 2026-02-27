import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_zoho_automation(booking_id, headless=False):
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASSWORD")

    if not email_user or not email_pass:
        print("Error: EMAIL_USER or EMAIL_PASSWORD not found in environment variables.")
        return

    # Setup Chrome options
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    # Initialize WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    try:
        print(f"Navigating to Zoho Mail...")
        driver.get("https://mail.zoho.in")

        # Handle Login
        print("Logging in...")
        wait = WebDriverWait(driver, 20)
        
        # Enter Email
        email_field = wait.until(EC.presence_of_element_located((By.ID, "login_id")))
        email_field.send_keys(email_user)
        email_field.send_keys(Keys.RETURN)

        # Enter Password
        password_field = wait.until(EC.presence_of_element_located((By.ID, "password")))
        password_field.send_keys(email_pass)
        password_field.send_keys(Keys.RETURN)

        # Wait for the mail dashboard to load
        print("Waiting for dashboard...")
        # Check for existence of a common mail element
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "zmAppContainer")))

        # Navigate to Sent Folder
        print("Navigating to Sent folder...")
        sent_folder = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@data-zm-folder-name='Sent' or contains(text(), 'Sent')]")))
        sent_folder.click()

        # Wait for Sent folder to load
        time.sleep(3) 

        # Find Search Box
        print(f"Searching for booking ID: {booking_id}...")
        search_box = wait.until(EC.presence_of_element_located((By.ID, "zmailSearchField")))
        search_box.clear()
        search_box.send_keys(booking_id)
        search_box.send_keys(Keys.RETURN)

        # Wait for results
        print("Waiting for search results...")
        time.sleep(5) # Give it some time to display results

        print("Automation completed successfully.")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        # Save screenshot for debugging
        driver.save_screenshot("zoho_error.png")
        print("Screenshot saved to zoho_error.png")
    finally:
        if not headless:
            input("Press Enter to close the browser...")
        driver.quit()

if __name__ == "__main__":
    BOOKING_ID = "K01B40130122025"
    run_zoho_automation(BOOKING_ID, headless=False)
