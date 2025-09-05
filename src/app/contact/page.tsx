import HomeNav from "@/components/core/HomeNav";
import ContactForm from "@/components/ContactForm";

const ContactPage = () => {
  return (
    <div className="h-dvh bg-black">
      <HomeNav currentPage="Contact" />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                Contact
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Let's talk about your next project
            </p>
          </div>
          
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default ContactPage;