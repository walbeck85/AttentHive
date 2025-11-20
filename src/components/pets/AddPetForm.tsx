'use client';

import { useState } from 'react';

export default function AddPetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    const formData = new FormData(e.currentTarget);
    
    const petData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      breed: formData.get('breed') as string,
      gender: formData.get('gender') as string,
      birthDate: formData.get('birthDate') as string,
      weight: parseFloat(formData.get('weight') as string),
    };

    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.validationErrors) {
          const errors: Record<string, string> = {};
          data.validationErrors.forEach((err: { field: string; message: string }) => {
            errors[err.field] = err.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.error || 'Something went wrong');
        }
      } else {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Add New Pet</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded border border-green-200">
          Pet added successfully! ✅
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.name && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select type...</option>
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
          </select>
          {validationErrors.type && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.type}</p>
          )}
        </div>

        {/* Breed */}
        <div>
          <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
            Breed <span className="text-red-500">*</span>
          </label>
          <input
            id="breed"
            name="breed"
            type="text"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.breed ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.breed && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.breed}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select gender...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {validationErrors.gender && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.gender}</p>
          )}
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.birthDate && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.birthDate}</p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (lbs) <span className="text-red-500">*</span>
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            step="0.1"
            min="0"
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.weight ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.weight && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.weight}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? 'Adding Pet...' : 'Add Pet'}
        </button>
      </form>
    </div>
  );
}