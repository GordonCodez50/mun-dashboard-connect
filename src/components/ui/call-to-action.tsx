
import { MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function CTA() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.175, 0.885, 0.32, 1.275] // Custom easing
      }
    }
  };

  const badgeAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    whileHover: {
      scale: 1.1,
      transition: {
        duration: 0.2,
        yoyo: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const buttonAnimation = {
    whileHover: { 
      scale: 1.05,
      x: 5,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    whileTap: { scale: 0.95 }
  };

  return (
    <div className="w-full py-8 lg:py-16">
      <div className="container mx-auto">
        <motion.div 
          className="flex flex-col text-center bg-muted rounded-md p-4 lg:p-8 gap-5 items-center relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Animated background elements */}
          <motion.div 
            className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl"
            animate={{ 
              x: [20, 0, 20],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
          
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent/10 dark:bg-accent/5 blur-3xl"
            animate={{ 
              x: [0, 20, 0],
              y: [20, 0, 20],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />

          <motion.div variants={itemVariants}>
            <motion.div {...badgeAnimation}>
              <Badge className="cursor-pointer">Get started</Badge>
            </motion.div>
          </motion.div>

          <motion.div className="flex flex-col gap-2" variants={itemVariants}>
            <motion.h3 
              className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              Access Your Dashboard!
            </motion.h3>
            <motion.p 
              className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Experience ISBMUN 2025's next-generation management platform—purpose-built for Bahrain's leading MUN conference. From real-time council management to instant alerts and seamless document sharing, every feature is tailored to streamline your MUN experience and keep the focus on diplomacy, debate, and leadership.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-row gap-4" 
            variants={itemVariants}
          >
            <motion.div {...buttonAnimation}>
              <Button asChild className="gap-4 relative group">
                <Link to="/login">
                  Login Now 
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "loop",
                      ease: "easeInOut",
                      repeatDelay: 0.5
                    }}
                  >
                    <MoveRight className="w-4 h-4" />
                  </motion.div>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export { CTA };
