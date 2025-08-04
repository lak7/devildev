const ContactPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Contact</h1>
        <p className="text-xl">
          Please mail to{' '}
          <a 
            href="mailto:contact@devildev.com" 
            className="text-red-400 hover:text-red-300 "
          >
            contact@devildev.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactPage;