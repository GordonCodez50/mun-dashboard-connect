
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
				border: {
					DEFAULT: 'hsl(var(--border))',
					dark: 'hsl(var(--border-dark))'
				},
				input: {
					DEFAULT: 'hsl(var(--input))',
					dark: 'hsl(var(--input-dark))'
				},
				ring: {
					DEFAULT: 'hsl(var(--ring))',
					dark: 'hsl(var(--ring-dark))'
				},
				background: {
					DEFAULT: 'hsl(var(--background))',
					dark: 'hsl(var(--background-dark))'
				},
				foreground: {
					DEFAULT: 'hsl(var(--foreground))',
					dark: 'hsl(var(--foreground-dark))'
				},
				primary: {
					DEFAULT: '#1A2544',
					foreground: '#FFFFFF',
					dark: '#1A2544',
					'dark-foreground': '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#1F2020',
					foreground: '#FFFFFF',
					dark: '#181818',
					'dark-foreground': '#FFFFFF'
				},
				accent: {
					DEFAULT: '#4581B6',
					foreground: '#FFFFFF',
					dark: '#5A92C7',
					'dark-foreground': '#FFFFFF'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					dark: 'hsl(var(--destructive-dark))',
					'dark-foreground': 'hsl(var(--destructive-foreground-dark))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
					dark: 'hsl(var(--muted-dark))',
					'dark-foreground': 'hsl(var(--muted-foreground-dark))'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#1A2544',
					dark: '#1A1F2C',
					'dark-foreground': '#FFFFFF'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#1A2544',
					dark: '#1A1F2C',
					'dark-foreground': '#FFFFFF'
				},
				sidebar: {
					DEFAULT: '#1A2544',
					foreground: '#FFFFFF',
					primary: '#4581B6',
					'primary-foreground': '#FFFFFF',
					accent: '#1F2020',
					'accent-foreground': '#FFFFFF',
					border: '#2a3656',
					ring: '#4581B6',
					dark: '#15192A',
					'dark-foreground': '#FFFFFF'
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
