import json
import re

# Load JSON file
with open('appointments.json', 'r', encoding='utf-8') as file:
    data = json.load(file)  # Load JSON content

# Ensure data is properly structured
if "lifesafer" in data:
    appointments = data["lifesafer"]  # Extract the actual list of appointments
else:
    print("Error: 'lifesafer' key not found in JSON!")
    exit()

# Print first 3 entries to confirm structure
print(json.dumps(appointments[:3], indent=4))

# Iterate through the list and check firmware values
for appointment in appointments:
    firm_ware = appointment.get("Firmware", "").strip()

    # Debug: Print extracted firmware
    print(f"Extracted firmware: '{firm_ware}' (repr: {repr(firm_ware)})")

    # Normalize: Remove non-breaking spaces & extra spaces
    firm_ware = firm_ware.replace('\xa0', ' ').strip()
    firm_ware = re.sub(r'\s+', ' ', firm_ware).strip()  # Remove multiple spaces

    # Check for "(Camera)" in firmware
    if '(camera)' in firm_ware.lower():
        firmware = 'Legacy'
    else:
        firmware = 'L250'

    print(f"Assigned Firmware: '{firmware}'\n")