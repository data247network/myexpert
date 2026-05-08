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
