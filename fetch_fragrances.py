import json
import os
import requests

API_KEY = "ae18d9d596cc01f52d6630fda768a2aba68b8b5312023769a6fcc40fb99703af"
URL = "https://api.fragella.com/api/v1/fragrances"
# Persist the filtered dataset inside the project directory
OUTPUT_FILE = "/Users/isaac/Projects/fragrances_filtered.json"
# Default search configuration
SEARCH_QUERY = "azzaro wanted"
RESULTS_PER_PAGE = 50  # Results per API request
MAX_PAGES = None  # Maximum number of pages to fetch (set to None for unlimited, or a number like 10)

FIELDS_TO_KEEP = [
    "Name",
    "Brand",
    "Year",
    "rating",
    "Country",
    "Image URL",
    "Gender",
    "Price",
    "OilType",
    "Longevity",
    "Sillage",
    "General Notes",
    "Main Accords",
    "Main Accords Percentage",
    "Season Ranking",
    "Occasion Ranking",
]


def filter_fragrance(fragrance: dict) -> dict:
    """Return a fragrance dict that only includes the allowed fields."""
    filtered = {}
    for field in FIELDS_TO_KEEP:
        if field in fragrance:
            filtered[field] = fragrance[field]
        else:
            # Ensure missing fields exist so the structure stays consistent
            if field in {"Year", "Country", "Price"}:
                filtered[field] = ""
            elif field in {"General Notes", "Main Accords"}:
                filtered[field] = []
            elif field == "Main Accords Percentage":
                filtered[field] = {}
            elif field in {"Season Ranking", "Occasion Ranking"}:
                filtered[field] = []
            else:
                filtered[field] = ""
    return filtered


def fragrance_key(fragrance: dict) -> str:
    """Create a unique key for duplicate detection."""
    name = fragrance.get("Name", "").strip().lower()
    brand = fragrance.get("Brand", "").strip().lower()
    return f"{name}::{brand}"


def ensure_list(data):
    if isinstance(data, list):
        return data
    if data:
        return [data]
    return []


def main():
    headers = {"x-api-key": API_KEY}
    all_new_data = []
    
    # Load existing data first to determine starting offset
    existing_data = []
    if os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 0:
        try:
            with open(OUTPUT_FILE, "r") as f:
                existing_data = ensure_list(json.load(f))
        except json.JSONDecodeError:
            print("Warning: Could not decode existing JSON. Starting fresh.")
    
    # Start from offset 0 to ensure we get all results for the current query
    # Deduplication will handle any overlaps with existing data
    starting_offset = 0
    starting_page = 0
    
    print(f"Fetching fragrances for query: '{SEARCH_QUERY}'")
    print(f"Results per page: {RESULTS_PER_PAGE}")
    print(f"Starting from offset: {starting_offset} (page {starting_page + 1})")
    print(f"Maximum pages: {MAX_PAGES if MAX_PAGES else 'Unlimited'}\n")
    
    page = starting_page
    
    while True:
        offset = page * RESULTS_PER_PAGE
        params = {
            "search": SEARCH_QUERY,
            "limit": RESULTS_PER_PAGE,
            "offset": offset
        }
        
        print(f"Fetching page {page + 1} (offset: {offset})...", end=" ")
        response = requests.get(URL, headers=headers, params=params)

        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code}")
            if response.status_code == 400:
                print("Response text:", response.text[:500])
            break

        try:
            page_data = ensure_list(response.json())
            if not page_data or len(page_data) == 0:
                print("No more results.")
                break
            
            all_new_data.extend(page_data)
            print(f"Got {len(page_data)} results (total so far: {len(all_new_data)})")
            
            # Stop if we got fewer results than requested (last page)
            if len(page_data) < RESULTS_PER_PAGE:
                print("Reached last page.")
                break
            
            # Stop if we've reached the maximum number of pages
            # Adjust for starting page when calculating pages fetched this run
            pages_fetched_this_run = (page + 1) - starting_page
            if MAX_PAGES and pages_fetched_this_run >= MAX_PAGES:
                print(f"Reached maximum page limit ({MAX_PAGES}).")
                break
                
        except json.JSONDecodeError:
            print("Error: Failed to decode JSON")
            print("Response text:", response.text[:500])
            break
        
        page += 1
    
    if not all_new_data:
        print("\nNo new data fetched. Exiting.")
        return
    
    print(f"\nTotal results fetched: {len(all_new_data)}")

    # Deduplicate existing data
    combined = {}
    for fragrance in existing_data:
        filtered = filter_fragrance(fragrance if isinstance(fragrance, dict) else {})
        combined[fragrance_key(filtered)] = filtered

    initial_count = len(combined)
    new_count = 0

    # Add new data, avoiding duplicates
    print("\nProcessing and filtering fragrances...")
    duplicate_count = 0
    for fragrance in all_new_data:
        filtered = filter_fragrance(fragrance if isinstance(fragrance, dict) else {})
        key = fragrance_key(filtered)
        if not key:
            print(f"  Warning: Skipping fragrance with no name/brand: {fragrance.get('Name', 'Unknown')}")
            continue
        if key not in combined:
            combined[key] = filtered
            new_count += 1
        else:
            duplicate_count += 1
            if duplicate_count <= 3:  # Show first 3 duplicates as examples
                existing = combined[key]
                print(f"  Duplicate found: {filtered.get('Name', 'Unknown')} by {filtered.get('Brand', 'Unknown')}")
    
    if duplicate_count > 0:
        print(f"  Total duplicates skipped: {duplicate_count}")

    final_data = list(combined.values())

    # Save to file
    with open(OUTPUT_FILE, "w") as f:
        json.dump(final_data, f, indent=4)

    print(f"\n✓ Updated {OUTPUT_FILE}.")
    print(f"  Existing fragrances: {initial_count}")
    print(f"  New fragrances added: {new_count}")
    print(f"  Total fragrances: {len(final_data)}")


if __name__ == "__main__":
    main()