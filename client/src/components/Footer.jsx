import { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import the translation hook
import { FaGlobe } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// --- Import the new modal component ---
import LanguageModal from './LanguageModal'; // Make sure this path is correct

// --- Data for the footer links ---
// Keys are now translation keys that match your translation.json files
const bottomLinks = [
    {
        title: "footer.about_section.title",
        links: [
            { title: "footer.about_section.about_us", to: "/about" },
            { title: "footer.about_section.careers", to: "/careers" },
            { title: "footer.about_section.contact_us", to: "/contact" },
            { title: "footer.about_section.blog", to: "/blog" },
            { title: "footer.about_section.investors", to: "/investors" },
        ],
    },
    {
        title: "footer.discover_section.title",
        links: [
            { title: "footer.discover_section.get_app", to: "/get-the-app" },
            { title: "footer.discover_section.teach", to: "/teach" },
            { title: "footer.discover_section.pricing", to: "/pricing" },
            { title: "footer.discover_section.affiliate", to: "/affiliate" },
            { title: "footer.discover_section.support", to: "/support" },
        ],
    },
    {
        title: "footer.business_section.title",
        links: [
            { title: "footer.business_section.business", to: "/business" },
        ],
    },
    {
        title: "footer.legal_section.title",
        links: [
            { title: "footer.legal_section.accessibility", to: "/accessibility-statement" },
            { title: "footer.legal_section.privacy", to: "/privacy-policy" },
            { title: "footer.legal_section.sitemap", to: "/sitemap" },
            { title: "footer.legal_section.terms", to: "/terms" },
        ],
    },
];

const Footer = () => {
  // State to control the modal's visibility
  const [isModalOpen, setModalOpen] = useState(false);

  // Get the translation function 't' from the i18next hook
  const { t, i18n } = useTranslation();

  return (
    // Use React Fragments <>...</> to return multiple top-level elements
    <>
      <footer className="bg-gray-900 text-gray-300 font-sans">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          
          <div className="border-b border-gray-700 my-8"></div>

          {/* Bottom Utility Links Section */}
          <section className="pb-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
                  {bottomLinks.map((section) => (
                      <div key={section.title}>
                          {/* Use the 't' function to translate the section title */}
                          <h4 className="font-bold text-white mb-3">{t(section.title)}</h4>
                          <ul className="space-y-2">
                              {section.links.map((link) => (
                                  <li key={link.title}>
                                      <Link to={link.to} className="hover:text-white hover:underline transition-colors duration-200 text-sm">
                                          {/* Use the 't' function to translate the link title */}
                                          {t(link.title)}
                                      </Link>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
          </section>
        </div>

        {/* Final Footer Bar */}
        <div className="bg-gray-900 border-t border-gray-700">
          <div className="container mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <Link to="/" className="text-2xl font-bold text-white">Samriddhi Gyan</Link>
                  <p className="text-sm text-gray-400">© {new Date().getFullYear()} Samriddhi Gyan</p>
              </div>
              <div className="flex items-center gap-6">
                  <button className="text-sm hover:text-white hover:underline">
                    {t('footer.cookie_settings')}
                  </button>
                  
                  {/* This button opens the language selection modal */}
                  <button 
                    onClick={() => setModalOpen(true)}
                    className="border border-white px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-colors duration-200 text-sm"
                  >
                      <FaGlobe />
                      {/* 
                        This dynamically shows the currently selected language name.
                        We find the language in our list that matches the current i18n language code.
                      */}
                      <span>{t(`languages.${i18n.language}`)}</span>
                  </button>
              </div>
          </div>
        </div>
      </footer>

      {/* 
        Render the modal component here.
        It will be invisible until `isModalOpen` is true.
        The modal will then use a React Portal to render itself at the top of the DOM.
      */}
      <LanguageModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Footer;