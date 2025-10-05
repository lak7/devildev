import useSWR from 'swr';

const fetcher = async (url: string) => {
    const response = await fetch(url, {
      credentials: 'include', // Include cookies in the request
    });
    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }
    return response.json();
  };

export default function useUserSubscription() {
    // SWR will cache the response and cookies will provide additional server-side caching
    const { data, error, isLoading } = useSWR( 
      `/api/user/subscription-status`, 
      fetcher,
    );
   
    
    const isPro = data?.subscriptionPlan === "PRO" && data?.subscription?.status === "ACTIVE";

    // alert(data?.subscriptionPlan)
   
    return {
      userSubscription: isPro,
      isLoadingUserSubscription: isLoading,
      isErrorUserSubscription: error
    };
  }