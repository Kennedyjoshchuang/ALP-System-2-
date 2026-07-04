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

  const hasAccessToCustomers = () => {
    const saved = sessionStorage.getItem('alp_user');
    if (!saved) return false;
    try {
      const user = JSON.parse(saved);
      if (user.role === 'owner') return true;
      const permissions = user.permissions || {};
      return permissions.marketing === 'write' || permissions.marketing === 'read';
    } catch (e) {
      return false;
    }
  };

  // Fetch customers – cached and refetched based on React‑Query defaults
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => apiRequest("customers"),
    enabled: hasAccessToCustomers()
  });

  const customers = Array.isArray(data) ? data : [];

  // Mutation to add a new customer
  const addCustomerMutation = useMutation({
    mutationFn: (newCustomer) => {
      // Ensure the payload follows the expected shape; generate an ID client‑side if not provided
      const payload = {
        ...newCustomer,
        id: newCustomer.id || `CUST-${Date.now().toString().slice(-4)}`,
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
      const tempId = newCustomer.id || `CUST-${Date.now().toString().slice(-4)}`;
      queryClient.setQueryData(CUSTOMERS_QUERY_KEY, [...previous, { ...newCustomer, id: tempId }]);
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

  // Mutation to update an existing customer
  const updateCustomerMutation = useMutation({
    mutationFn: (updatedCustomer) => {
      return apiRequest(`customers/${updatedCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedCustomer),
      });
    },
    // Optimistically update the cache
    onMutate: async (updatedCustomer) => {
      await queryClient.cancelQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      const previous = queryClient.getQueryData(CUSTOMERS_QUERY_KEY) || [];
      queryClient.setQueryData(
        CUSTOMERS_QUERY_KEY,
        previous.map((c) => (c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c))
      );
      return { previous };
    },
    onError: (err, updatedCustomer, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, context.previous);
      }
      console.error("Failed to update customer:", err);
    },
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
    updateCustomer: updateCustomerMutation.mutateAsync,
    updateCustomerStatus: updateCustomerMutation.status,
  };
}

