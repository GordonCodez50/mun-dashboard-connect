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
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#1F2020',
					foreground: '#FFFFFF'
				},
				accent: {
					DEFAULT: '#4581B6',
					foreground: '#FFFFFF'
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
        'gradient-border': {
          '0%, 100%': { transform: 'translate(0)' },
          '50%': { transform: 'translate(50px, 50px)' }
        },
        'gradient-1': {
          '0%': { transform: 'translate(0) scale(2)', opacity: '0' },
          '33%': { transform: 'translate(100px, 100px) scale(2.2)', opacity: '0.8' },
          '66%': { transform: 'translate(-50px, 150px) scale(1.8)', opacity: '0.4' },
          '100%': { transform: 'translate(0) scale(2)', opacity: '0' }
        },
        'gradient-2': {
          '0%': { transform: 'translate(0) scale(2)', opacity: '0' },
          '33%': { transform: 'translate(-150px, -50px) scale(2.2)', opacity: '0.8' },
          '66%': { transform: 'translate(50px, -100px) scale(1.8)', opacity: '0.4' },
          '100%': { transform: 'translate(0) scale(2)', opacity: '0' }
        },
        'gradient-3': {
          '0%': { transform: 'translate(0) scale(2)', opacity: '0' },
          '33%': { transform: 'translate(150px, -50px) scale(2.2)', opacity: '0.8' },
          '66%': { transform: 'translate(-100px, -50px) scale(1.8)', opacity: '0.4' },
          '100%': { transform: 'translate(0) scale(2)', opacity: '0' }
        },
        'gradient-4': {
          '0%': { transform: 'translate(0) scale(2)', opacity: '0' },
          '33%': { transform: 'translate(-150px, 50px) scale(2.2)', opacity: '0.8' },
          '66%': { transform: 'translate(100px, 50px) scale(1.8)', opacity: '0.4' },
          '100%': { transform: 'translate(0) scale(2)', opacity: '0' }
        },
      },
      animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
				'scale-in': 'scale-in 0.2s ease-out',
				'rainbow': 'rainbow 4s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
