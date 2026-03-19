"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createBatch } from '@/lib/actions/dashboard-actions';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  batchName: z.string().min(2, "Batch name is required"),
  breed: z.enum(["Broiler", "Layer"]),
  initialQuantity: z.number().min(1, "Quantity must be at least 1"),
  hatchDate: z.string().min(1, "Hatch date is required"),
  houseId: z.string().min(1, "House selection is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterBatchFormProps {
  houses: Array<{
    id: number;
    houseNumber: string;
  }>;
}

export function RegisterBatchForm({ houses }: RegisterBatchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      breed: "Broiler",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createBatch({
        houseId: parseInt(data.houseId),
        breedType: data.breed,
        initialCount: data.initialQuantity,
        arrivalDate: data.hatchDate,
      });

      if (result.success) {
        alert("Batch registered successfully!");
        router.refresh();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-lg w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Register New Batch</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Batch Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
          <input
            {...register("batchName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="e.g., Spring-Broiler-01"
          />
          {errors.batchName && <p className="text-red-500 text-xs mt-1">{errors.batchName.message}</p>}
        </div>

        {/* Breed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <select
            {...register("breed")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white text-gray-900"
          >
            <option value="Broiler">Broiler (Meat)</option>
            <option value="Layer">Layer (Eggs)</option>
          </select>
          {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed.message}</p>}
        </div>

        {/* Initial Quantity & House Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
            <input
              type="number"
              {...register("initialQuantity", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="1000"
            />
            {errors.initialQuantity && <p className="text-red-500 text-xs mt-1">{errors.initialQuantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House</label>
            <select
              {...register("houseId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white text-gray-900"
            >
              <option value="">Select House</option>
              {houses.map((house) => (
                <option key={house.id} value={house.id.toString()}>
                  {house.houseNumber}
                </option>
              ))}
            </select>
            {errors.houseId && <p className="text-red-500 text-xs mt-1">{errors.houseId.message}</p>}
          </div>
        </div>

        {/* Hatch Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hatch Date</label>
          <input
            type="date"
            {...register("hatchDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white text-gray-900"
          />
          {errors.hatchDate && <p className="text-red-500 text-xs mt-1">{errors.hatchDate.message}</p>}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm transition-colors focus:outline-none z-10 disabled:opacity-50"
          >
            {isSubmitting ? "Registering..." : "Register Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
