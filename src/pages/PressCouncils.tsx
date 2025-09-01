import React, { useState, useEffect } from 'react';
import { PressLayout } from '@/components/layout/PressLayout';
import { PressMobileNav } from '@/components/layout/PressMobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Search, MapPin, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface CouncilInfo {
  name: string;
  room?: string;
  floor?: string;
}

const PressCouncils = () => {
  const [councils, setCouncils] = useState<CouncilInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('council, room_no, floor_no')
          .not('council', 'is', null)
          .neq('council', 'PRESS');

        if (error) {
          console.error('Error fetching profiles:', error);
          toast.error('Failed to load council information');
          return;
        }

        // Group by council and get room/floor information
        const councilMap = new Map<string, CouncilInfo>();
        
        profiles?.forEach((profile) => {
          if (profile.council) {
            const existing = councilMap.get(profile.council);
            
            if (!existing) {
              councilMap.set(profile.council, {
                name: profile.council,
                room: profile.room_no || undefined,
                floor: profile.floor_no || undefined,
              });
            } else {
              // Update room/floor if not already set
              if (!existing.room && profile.room_no) {
                existing.room = profile.room_no;
              }
              if (!existing.floor && profile.floor_no) {
                existing.floor = profile.floor_no;
              }
            }
          }
        });

        const councilList = Array.from(councilMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setCouncils(councilList);
      } catch (error) {
        console.error('Error fetching councils:', error);
        toast.error('Failed to load council information');
      } finally {
        setLoading(false);
      }
    };

    fetchCouncils();
  }, []);

  const filteredCouncils = councils.filter(council =>
    council.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    council.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    council.floor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PressLayout activeItem="/press-councils">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading council information...
          </div>
        </div>
      </PressLayout>
    );
  }

  return (
    <PressLayout activeItem="/press-councils">
      <div className="space-y-6">
        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between">
          <PressMobileNav />
          <h1 className="text-xl font-bold">Councils</h1>
          <div></div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Council Directory</h1>
            <p className="text-muted-foreground">View council locations and chair information</p>
          </div>
          <Badge variant="outline" className="self-start sm:self-center">
            <Users className="w-3 h-3 mr-1" />
            {councils.length} Councils
          </Badge>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search councils, rooms, or floors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Councils Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Council Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isMobile ? (
                <div className="space-y-3 p-4">
                  {filteredCouncils.map((council, index) => (
                    <motion.div
                      key={council.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-muted/50 p-3 rounded-lg space-y-2"
                    >
                      <h3 className="font-medium">{council.name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        {council.room && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {council.room}
                          </div>
                        )}
                        {council.floor && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Floor {council.floor}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Council</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Floor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCouncils.map((council, index) => (
                        <motion.tr
                          key={council.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">{council.name}</TableCell>
                          <TableCell>
                            {council.room ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {council.room}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {council.floor ? (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {council.floor}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
              )}
              
              {filteredCouncils.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No councils found matching your search.' : 'No councils available.'}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PressLayout>
  );
};

export default PressCouncils;