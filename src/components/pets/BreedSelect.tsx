// src/components/pets/BreedSelect.tsx
// A small, reusable breed selector component that exposes a controlled API.
// Using a native <datalist> keeps the UI searchable without pulling in
// a heavy combobox library.

import React from "react";
import { getBreedsForType } from "@/lib/breeds";

type BreedSelectProps = {
  petType: "DOG" | "CAT" | null; 
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export default function BreedSelect({
  petType,
  value,
  onChange,
  disabled = false,
  required = false,
}: BreedSelectProps) {
  // If no pet type selected yet, we don't present a breed list.
  const breeds = petType ? getBreedsForType(petType) : [];

  const listId = petType ? `${petType.toLowerCase()}-breeds` : "breeds-empty";

  return (
    <div className="flex flex-col gap-1">
      {/* Controlled text input tied to breed name */}
      <input
        type="text"
        list={listId}
        value={value}
        disabled={disabled || !petType}
        required={required}
        placeholder={!petType ? "Select pet type first" : "Select breed…"}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1"
      />

      {/* Searchable list of breeds based on pet type */}
      <datalist id={listId}>
        {breeds.map((breed) => (
          <option key={breed} value={breed} />
        ))}
      </datalist>
    </div>
  );
}