
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from "@/components/ui/input";

export interface AddressComponents {
  fullAddress: string;
  streetNumber: string;
  streetName: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (components: AddressComponents) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Only load if API key is present
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_PLACES_API_KEY is missing. Address Autocomplete disabled.");
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      if (!inputRef.current) return;

      const autocompleteInstance = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'au' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place.address_components) return;

        const components: AddressComponents = {
          fullAddress: place.formatted_address || '',
          streetNumber: '',
          streetName: '',
          suburb: '',
          state: '',
          postcode: '',
          country: '',
        };

        for (const component of place.address_components) {
          const type = component.types[0];
          switch (type) {
            case 'street_number':
              components.streetNumber = component.long_name;
              break;
            case 'route':
              components.streetName = component.long_name;
              break;
            case 'locality':
              components.suburb = component.long_name;
              break;
            case 'administrative_area_level_1':
              components.state = component.short_name;
              break;
            case 'postal_code':
              components.postcode = component.long_name;
              break;
            case 'country':
              components.country = component.short_name;
              break;
          }
        }

        // Also call onChange to update the input display value
        onChange(components.fullAddress);
        onAddressSelect(components);
      });

      setAutocomplete(autocompleteInstance);
    }).catch(err => {
      console.error("Failed to load Google Maps API", err);
    });
  }, [onAddressSelect, onChange]);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter property address..."
      className="w-full"
    />
  );
}
