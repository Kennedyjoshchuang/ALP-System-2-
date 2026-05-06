// src/api/hooks/useCustomers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api.js";

// Query key constant for easy invalidation
const CUSTOMERS_QUERY_KEY = ["customers"];

/**
 * Hook to fetch customers and provide addCustomer mutation.
 * Returns the customers array, loading state, error, and a mutation function.
 */
export function useCustomers() {
  const queryClient = useQueryClient();

  // Fetch customers – cached and refetched based on React‑Query defaults
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => apiRequest("customers")
  });

  // Mutation to add a new customer
  const addCustomerMutation = useMutation({
    mutationFn: (newCustomer) => {
      // Ensure the payload follows the expected shape; generate an ID client‑side for now
      const payload = {
        ...newCustomer,
        id: `CUST-${Date.now().toString().slice(-4)}`,
      };
      return apiRequest("customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    // Optimistically update the cache so UI feels instant
    onMutate: async (newCustomer) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      const previous = queryClient.getQueryData(CUSTOMERS_QUERY_KEY) || [];
      queryClient.setQueryData(CUSTOMERS_QUERY_KEY, [...previous, newCustomer]);
      return { previous };
    },
    // If the mutation fails, roll back to previous data
    onError: (err, newCustomer, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, context.previous);
      }
      console.error("Failed to add customer:", err);
    },
    // After success, refetch to ensure server data is authoritative
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  return {
    customers,
    isLoading,
    isError,
    error,
    refetch,
    addCustomer: addCustomerMutation.mutateAsync,
    addCustomerStatus: addCustomerMutation.status,
  };
}

