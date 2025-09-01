
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Video,
    Globe,
} from "lucide-react";
import { useInView } from "framer-motion";
import { useRef } from "react";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

const itemsSample: BentoItem[] = [
    {
        title: "Analytics Dashboard",
        meta: "v2.4.1",
        description:
            "Real-time metrics with AI-powered insights and predictive analytics",
        icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
        status: "Live",
        tags: ["Statistics", "Reports", "AI"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "Task Manager",
        meta: "84 completed",
        description: "Automated workflow management with priority scheduling",
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        status: "Updated",
        tags: ["Productivity", "Automation"],
    },
    {
        title: "Media Library",
        meta: "12GB used",
        description: "Cloud storage with intelligent content processing",
        icon: <Video className="w-4 h-4 text-purple-500" />,
        tags: ["Storage", "CDN"],
        colSpan: 2,
    },
    {
        title: "Global Network",
        meta: "6 regions",
        description: "Multi-region deployment with edge computing",
        icon: <Globe className="w-4 h-4 text-sky-500" />,
        status: "Beta",
        tags: ["Infrastructure", "Edge"],
    },
];

function BentoGrid({ items = itemsSample }: BentoGridProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    
    // Container animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
                duration: 0.4,
            }
        }
    };
    
    // Individual item animation variants
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div 
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto"
        >
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ 
                        y: -5,
                        transition: { duration: 0.2 }
                    }}
                    className={cn(
                        "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
                        "border border-gray-100/80 dark:border-white/10 bg-white dark:bg-black",
                        "hover:shadow-lg dark:hover:shadow-[0_4px_16px_rgba(255,255,255,0.06)]",
                        "will-change-transform",
                        item.colSpan || "col-span-1",
                        item.colSpan === 2 ? "md:col-span-2" : "",
                        {
                            "shadow-lg -translate-y-0.5":
                                item.hasPersistentHover,
                            "dark:shadow-[0_2px_12px_rgba(255,255,255,0.06)]":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
                    </div>

                    <div className="relative flex flex-col space-y-3">
                        <motion.div 
                            className="flex items-center justify-between"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            <motion.div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/10 group-hover:bg-gradient-to-br transition-all duration-300"
                                whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                {item.icon}
                            </motion.div>
                            <motion.span
                                className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm",
                                    "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300",
                                    "transition-colors duration-300 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                                )}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                {item.status || "Active"}
                            </motion.span>
                        </motion.div>

                        <motion.div 
                            className="space-y-2"
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 tracking-tight text-[15px]">
                                {item.title}
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                                    {item.meta}
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug font-[425]">
                                {item.description}
                            </p>
                        </motion.div>

                        <motion.div 
                            className="flex items-center justify-between mt-2"
                            initial={{ opacity: 0.7 }}
                            whileHover={{ opacity: 1 }}
                        >
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                {item.tags?.map((tag, i) => (
                                    <motion.span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/20"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        #{tag}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-gray-100/50 to-transparent dark:via-white/10 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                        animate={{
                            background: [
                                "linear-gradient(to right bottom, transparent, rgba(158, 158, 158, 0.1), transparent)",
                                "linear-gradient(to right bottom, transparent, rgba(158, 158, 158, 0.2), transparent)",
                                "linear-gradient(to right bottom, transparent, rgba(158, 158, 158, 0.1), transparent)"
                            ]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

export { BentoGrid }
