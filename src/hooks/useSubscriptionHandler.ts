import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { fetchUserWithSubscription } from "../../actions/subscription"

export function useSubscriptionHandler() {
  const { user } = useUser()
  const router = useRouter()

  const handleSubscription = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    const userWithSubscription = await fetchUserWithSubscription(user.id)
    if (userWithSubscription?.subscriptionPlan == "FREE" && userWithSubscription?.subscription?.status !== "ACTIVE") {
      if(!process.env.NEXT_PUBLIC_DODO_PAYMENT_LINK || !process.env.NEXT_PUBLIC_BASE_URL) {
        alert("Payment link or base URL not found")
        return
      }
      const redirectUrl = process.env.NEXT_PUBLIC_BASE_URL + "/success"
      const userEmail = userWithSubscription.email

      const liveUrl = process.env.NEXT_PUBLIC_DODO_PAYMENT_LINK + `?quantity=1&redirect_url=${redirectUrl}&email=${userEmail}&disableEmail=true`
 
      if (!liveUrl) {
        alert("Payment link not found")
        return
      }
      window.location.href = liveUrl
      return
    } else {
      alert("You are rich man")
    }
  }

  return handleSubscription
}

