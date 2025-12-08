import json
import os
import re

# File paths
INPUT_FILE = "/Users/isaac/Projects/fragrances_filtered.json"
COMPONENTS_DIR = "/Users/isaac/Projects/src/components/profiles"

# Ensure directory exists
os.makedirs(COMPONENTS_DIR, exist_ok=True)

def sanitize_filename(name):
    """Convert a fragrance name into a valid filename/component name."""
    # Remove special characters and spaces, capitalize for PascalCase
    clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    words = clean_name.split()
    return "".join(word.capitalize() for word in words)

def generate_component(fragrance):
    """Generate a React component string for a fragrance."""
    component_name = sanitize_filename(fragrance["Name"] + fragrance["Brand"])
    
    # Handle potentially missing or empty fields safely
    name = fragrance.get("Name", "Unknown Fragrance")
    brand = fragrance.get("Brand", "Unknown Brand")
    image_url = fragrance.get("Image URL", "")
    rating = fragrance.get("rating", "N/A")
    price = fragrance.get("Price", "N/A")
    description = fragrance.get("description", f"A fragrance by {brand}.") # Fallback if no description
    
    # Notes processing
    notes = fragrance.get("General Notes", [])
    notes_display = ", ".join(notes[:5]) if notes else "No notes available"

    # Accords processing
    accords = fragrance.get("Main Accords", [])
    accords_display = ", ".join(accords[:5]) if accords else "No accords available"

    
    jsx_content = f"""import React from 'react';

const {component_name} = () => {{
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="w-32 h-32 mb-4 overflow-hidden rounded-full bg-gray-50 flex items-center justify-center">
          {f'<img src="{image_url}" alt="{name}" className="w-full h-full object-cover" />' if image_url else '<div className="text-gray-300">No Image</div>'}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">{brand}</p>
        
        <div className="w-full space-y-4 text-left">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600 text-sm">Rating</span>
            <span className="font-semibold text-gray-900">{rating} / 5</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600 text-sm">Price</span>
            <span className="font-semibold text-gray-900">${price}</span>
          </div>

          <div className="py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Notes</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{notes_display}</p>
          </div>

          <div className="py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Accords</h3>
            <div className="flex flex-wrap gap-2">
              {'{'}[{', '.join([f'"{accord}"' for accord in accords[:5]])}].map((accord, idx) => (
                <span key={{idx}} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md capitalize">
                  {{accord}}
                </span>
              )){'}'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}};

export default {component_name};
"""
    return component_name, jsx_content

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    try:
        with open(INPUT_FILE, "r") as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            # Handle case where file might be empty or single object
             print(f"Warning: Expected list in {INPUT_FILE}, found {type(data)}. Converting...")
             if isinstance(data, dict):
                 data = [data]
             else:
                 data = []

        print(f"Generating profiles for {len(data)} fragrances...")
        
        generated_files = []
        for fragrance in data:
            if not fragrance.get("Name"):
                continue
                
            component_name, content = generate_component(fragrance)
            filename = f"{component_name}.jsx"
            file_path = os.path.join(COMPONENTS_DIR, filename)
            
            with open(file_path, "w") as f:
                f.write(content)
            
            generated_files.append(filename)
            print(f"Created {filename}")

        print(f"Successfully created {len(generated_files)} profile components in {COMPONENTS_DIR}")

    except json.JSONDecodeError:
        print(f"Error: Failed to decode {INPUT_FILE}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()

