// Minimal trpc stub for type-checking during development
// Replace with your real trpc client generator when ready

export const trpc: any = {
  auth: {
    me: {
      useQuery: (_: any, __?: any) => ({ data: null, isLoading: false }),
    },
    logout: {
      useMutation: (_opts?: any) => ({ mutate: () => {} }),
    },
  },
  // generic placeholders for other routers used in the codebase
  subscription: {
    getFeatureAccess: { useQuery: () => ({ data: null }) },
  },
};

export default trpc;
