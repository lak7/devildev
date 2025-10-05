import useSWR from 'swr';
const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  };

export default  function useUserSubscription () {

    const { data, error, isLoading } = useSWR(`/api/user/subscription-status`, fetcher)
    const isPro = data?.subscriptionPlan === "PRO" && data?.subscription?.status === "ACTIVE"
   
    return {
      userSubscription: isPro,
      isLoadingUserSubscription: isLoading,
      isErrorUserSubscription: error
    }
  }