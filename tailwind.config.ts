
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#1A2544',
					foreground: '#FFFFFF',
					light: '#2a3656',
					dark: '#11192d'
				},
				secondary: {
					DEFAULT: '#1F2020',
					foreground: '#FFFFFF',
					light: '#2a2b2b',
					dark: '#151616'
				},
				accent: {
					DEFAULT: '#4581B6',
					foreground: '#FFFFFF',
					light: '#5a92c7',
					dark: '#336d9e'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#1A2544'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#1A2544'
				},
				sidebar: {
					DEFAULT: '#1A2544',
					foreground: '#FFFFFF',
					primary: '#4581B6',
					'primary-foreground': '#FFFFFF',
					accent: '#1F2020',
					'accent-foreground': '#FFFFFF',
					border: '#2a3656',
					ring: '#4581B6'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(69, 129, 182, 0.5)' },
					'50%': { boxShadow: '0 0 15px rgba(69, 129, 182, 0.8)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
				'scale-in': 'scale-in 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite'
			},
			boxShadow: {
				'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
				'card-hover': '0 8px 16px rgba(0, 0, 0, 0.1)',
				'button': '0 2px 5px rgba(0, 0, 0, 0.1)',
				'button-hover': '0 4px 8px rgba(0, 0, 0, 0.15)'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'card-gradient': 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
				'accent-gradient': 'linear-gradient(135deg, #4581B6 0%, #5a92c7 100%)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
