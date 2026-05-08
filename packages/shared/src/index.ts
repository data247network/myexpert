// Types
export * from './types/database'

// Supabase client
export { supabase } from './lib/supabase'

// Constants
export const APP_NAME = 'MyExpert'
export const SUPPORT_EMAIL = 'support@myexpert.ng'
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]
export const VERIFICATION_STEPS = [
  {
    number:      1,
    name:        'NIN Verification',
    description: 'Enter your 11-digit National Identification Number.',
    icon:        '🪪',
  },
  {
    number:      2,
    name:        'Selfie & Liveness',
    description: 'Upload a clear selfie so we can match your face to your ID.',
    icon:        '🤳',
  },
  {
    number:      3,
    name:        'Address Verification',
    description: 'Provide your current residential address.',
    icon:        '🏠',
  },
  {
    number:      4,
    name:        'Skill Certificate',
    description: 'Upload a certificate, trade qualification, or proof of skill.',
    icon:        '📜',
  },
  {
    number:      5,
    name:        'References (3)',
    description: 'Provide contact details for three people who can vouch for you.',
    icon:        '👥',
  },
]

export const CATEGORIES = [
  { name: 'Plumber',           icon: '🔧' },
  { name: 'Electrician',       icon: '⚡' },
  { name: 'Tailor',            icon: '🧵' },
  { name: 'AC Repair',         icon: '❄️' },
  { name: 'Cleaner',           icon: '🧹' },
  { name: 'Mechanic',          icon: '🔩' },
  { name: 'Hairstylist',       icon: '💇' },
  { name: 'Generator',         icon: '⚙️' },
  { name: 'Carpenter',         icon: '🪚' },
  { name: 'Painter',           icon: '🖌️' },
  { name: 'Mover',             icon: '📦' },
  { name: 'Tutor',             icon: '📚' },
  { name: 'Laundry',           icon: '👕' },
  { name: 'Security',          icon: '🛡️' },
]
