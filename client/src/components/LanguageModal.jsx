import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

// --- Data for the languages. You can expand this list. ---
const languages = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italiano' },
    { code: 'ro', name: 'Română' },
    { code: 'zh-TW', name: '中文(繁體)' },
    { code: 'ar', name: 'العربية' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' },
    { code: 'th', name: 'ภาษาไทย' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ko', name: '한국어' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'es', name: 'Español' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'fr', name: 'Français' },
    { code: 'pl', name: 'Polski' },
    { code: 'zh-CN', name: '中文(简体)' },
    { code: 'id', name: 'Bahasa Indonesia' },





    { code: 'pt', name: 'Português' },

    { code: 'hi', name: 'हिन्दी' },      // Hindi
    { code: 'ne', name: 'नेपाली' },      // Nepali
    { code: 'ar', name: 'العربية' },
    // Add any other languages here
];

const LanguageModal = ({ isOpen, onClose }) => {
    const { i18n, t } = useTranslation();

    const handleLanguageChange = (langCode) => {
        i18n.changeLanguage(langCode);
        onClose(); // Close the modal after selection
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{t('language_switcher.choose_language')}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`px-4 py-2 text-left rounded-md transition-colors text-gray-700
                    ${i18n.language.startsWith(lang.code) ? 'border border-black font-semibold' : 'hover:bg-gray-100'}`}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.getElementById('modal-root'));
};

LanguageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default LanguageModal;