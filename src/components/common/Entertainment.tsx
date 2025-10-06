import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import { Tv } from 'lucide-react';

export default function Entertainment() {
  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm">
        <Accordion type="single" collapsible>
          <AccordionItem value="entertainment" className="border-none">
             <Card className="shadow-2xl rounded-lg">
                <AccordionTrigger className="w-full p-4 rounded-t-lg bg-background hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">
                      Entertainment
                    </h2>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <VideoPlayer />
                </AccordionContent>
             </Card>
          </AccordionItem>
        </Accordion>
      </div>
  )
}
