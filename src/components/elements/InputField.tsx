'use client';

import React from 'react';
import { Controller } from 'react-hook-form';

export interface InputFieldProps {
  control: any;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  errors: any;
}

const InputField: React.FC<InputFieldProps> = ({ control, name, label, type, required, options, errors }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        type === 'select' ? (
          <select
            {...field}
            className={`shadow-sm appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            id={name}
          >
            <option value="">Select {label}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...field}
            className={`shadow-sm appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            id={name}
            type={type}
            max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
          />
        )
      )}
    />
    {errors[name] && <p className="text-red-500 text-xs italic mt-1">{errors[name].message}</p>}
  </div>
);

export default InputField;
