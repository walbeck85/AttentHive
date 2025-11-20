'use client';

import { useState } from 'react';

export default function AddPetForm({ onPetAdded }: { onPetAdded?: () => void }) {
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
        if (onPetAdded) {
          onPetAdded();
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg" style={{ borderRadius: '16px' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: '#D17D45' }}>
        Add New Pet
      </h2>

      {success && (
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '2px solid #8BA888' }}>
          <span className="text-lg">✅ Pet added successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: '2px solid #EF5350' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Name <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.name ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.name && (e.target.style.borderColor = '#F4D5B8')}
          />
          {validationErrors.name && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.name}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Type <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.type ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.type && (e.target.style.borderColor = '#F4D5B8')}
          >
            <option value="">Select type...</option>
            <option value="DOG">🐕 Dog</option>
            <option value="CAT">🐱 Cat</option>
          </select>
          {validationErrors.type && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.type}</p>
          )}
        </div>

        {/* Breed */}
        <div>
          <label htmlFor="breed" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Breed <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <input
            id="breed"
            name="breed"
            type="text"
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.breed ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.breed && (e.target.style.borderColor = '#F4D5B8')}
          />
          {validationErrors.breed && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.breed}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Gender <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <select
            id="gender"
            name="gender"
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.gender ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.gender && (e.target.style.borderColor = '#F4D5B8')}
          >
            <option value="">Select gender...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {validationErrors.gender && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.gender}</p>
          )}
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Birth Date <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.birthDate ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.birthDate && (e.target.style.borderColor = '#F4D5B8')}
          />
          {validationErrors.birthDate && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.birthDate}</p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-semibold mb-2" style={{ color: '#4A4A4A' }}>
            Weight (lbs) <span style={{ color: '#D17D45' }}>*</span>
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            step="0.1"
            min="0"
            required
            className="w-full px-4 py-3 border-2 focus:outline-none transition-all"
            style={{
              borderRadius: '12px',
              borderColor: validationErrors.weight ? '#EF5350' : '#F4D5B8',
              backgroundColor: '#FEFEFE'
            }}
            onFocus={(e) => e.target.style.borderColor = '#D17D45'}
            onBlur={(e) => !validationErrors.weight && (e.target.style.borderColor = '#F4D5B8')}
          />
          {validationErrors.weight && (
            <p className="text-sm mt-1" style={{ color: '#C62828' }}>{validationErrors.weight}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 font-semibold text-white text-lg transition-all shadow-md"
          style={{
            borderRadius: '12px',
            backgroundColor: isSubmitting ? '#D1D5DB' : '#D17D45',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#B8663D')}
          onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#D17D45')}
        >
          {isSubmitting ? 'Adding Pet...' : 'Add Pet'}
        </button>
      </form>
    </div>
  );
}