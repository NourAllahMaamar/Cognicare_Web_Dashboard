// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Organization Leader Onboarding Modal
 * Shows on first login to introduce org leader features
 */
export default function OrgOnboardingModal({ onComplete }) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [show, setShow] = useState(true);

  const slides = [
    {
      icon: '🏢',
      title: t('orgOnboarding.welcome.title', 'Welcome to CogniCare'),
      subtitle: t('orgOnboarding.welcome.subtitle', 'Organization Leader Portal'),
      description: t('orgOnboarding.welcome.description', 'Manage your organization, monitor staff performance, and stay connected with your community.'),
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: '💬',
      title: t('orgOnboarding.community.title', 'Community Feed'),
      subtitle: t('orgOnboarding.community.subtitle', 'Stay Connected'),
      description: t('orgOnboarding.community.description', 'View posts from families, specialists, and caregivers. Stay informed about community activities and needs.'),
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: '🛍️',
      title: t('orgOnboarding.marketplace.title', 'Marketplace'),
      subtitle: t('orgOnboarding.marketplace.subtitle', 'Resource Discovery'),
      description: t('orgOnboarding.marketplace.description', 'Browse products and resources that families are using. Understand the tools that support cognitive care.'),
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      icon: '👥',
      title: t('orgOnboarding.staff.title', 'Staff Management'),
      subtitle: t('orgOnboarding.staff.subtitle', 'Monitor Performance'),
      description: t('orgOnboarding.staff.description', 'Track specialist progress, view AI-powered insights, and ensure quality care delivery across your organization.'),
      gradient: 'from-green-500 to-green-600',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setShow(false);
    // Mark onboarding as complete in localStorage
    localStorage.setItem('orgLeaderOnboardingComplete', 'true');
    if (onComplete) onComplete();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-0">
            <button
              onClick={handleSkip}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium"
            >
              {t('common.skip', 'Skip')}
            </button>
          </div>

          {/* Slide Content */}
          <div className="p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {/* Icon */}
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center text-6xl mb-6 shadow-lg`}>
                  {slides[currentSlide].icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {slides[currentSlide].title}
                </h2>

                {/* Subtitle */}
                <p className={`text-lg font-semibold mb-4 bg-gradient-to-r ${slides[currentSlide].gradient} bg-clip-text text-transparent`}>
                  {slides[currentSlide].subtitle}
                </p>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            {/* Progress Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button
                  onClick={() => setCurrentSlide(currentSlide - 1)}
                  className="flex-1 py-3 px-6 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('common.back', 'Back')}
                </button>
              )}
              <button
                onClick={handleNext}
                className={`${currentSlide === 0 ? 'w-full' : 'flex-1'} py-3 px-6 bg-gradient-to-r ${slides[currentSlide].gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
              >
                {currentSlide === slides.length - 1
                  ? t('common.getStarted', 'Get Started')
                  : t('common.next', 'Next')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
