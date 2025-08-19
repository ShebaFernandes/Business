import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ChevronRight, Building, Users, Briefcase } from 'lucide-react';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Food & Beverage', 'Entertainment', 'Other'
];

const businessSizes = [
  { value: '1-10', label: '1-10 employees', icon: Users },
  { value: '11-50', label: '11-50 employees', icon: Building },
  { value: '51+', label: '51+ employees', icon: Briefcase }
];

export const OnboardingFlow: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    businessSize: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required';
        }
        break;
      case 2:
        if (!formData.industry) {
          newErrors.industry = 'Please select an industry';
        }
        break;
      case 3:
        if (!formData.businessSize) {
          newErrors.businessSize = 'Please select your business size';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        await completeOnboarding(formData);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">What's your business name?</h2>
              <p className="text-gray-600 dark:text-gray-400">This helps us personalize your experience</p>
            </div>
            
            <Input
              type="text"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              error={errors.businessName}
              className="text-center text-lg"
            />
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">What industry are you in?</h2>
              <p className="text-gray-600 dark:text-gray-400">Help us provide relevant insights</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {industries.map((industry) => (
                <motion.button
                  key={industry}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.industry === industry
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('industry', industry)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {industry}
                </motion.button>
              ))}
            </div>
            
            {errors.industry && (
              <p className="text-red-500 text-sm text-center">{errors.industry}</p>
            )}
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">How big is your team?</h2>
              <p className="text-gray-600 dark:text-gray-400">This helps us tailor our recommendations</p>
            </div>
            
            <div className="space-y-4">
              {businessSizes.map((size) => {
                const Icon = size.icon;
                return (
                  <motion.button
                    key={size.value}
                    className={`w-full p-6 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${
                      formData.businessSize === size.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('businessSize', size.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-lg font-medium">{size.label}</span>
                  </motion.button>
                );
              })}
            </div>
            
            {errors.businessSize && (
              <p className="text-red-500 text-sm text-center">{errors.businessSize}</p>
            )}
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome, {user?.name}! 👋
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Let's get your business set up in just a few steps
            </p>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    currentStep >= step
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 transition-all duration-300 ${
                      currentStep > step
                        ? 'bg-primary'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <Card className="p-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
          
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>{currentStep === 3 ? 'Complete Setup' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};