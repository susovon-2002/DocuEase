"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import { Separator } from "./ui/separator";

const printOptions = [
  { item: "Black & White Print", cost: "₹3 / page" },
  { item: "Color Print", cost: "₹5 / page" },
  { item: "Glossy Photo Paper", cost: "₹15 / photo" },
];

export function PrintDeliveryOptions() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <Printer className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl">Print & Delivery Service</CardTitle>
        <CardDescription>
          Get physical copies of your documents delivered right to your
          doorstep.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Document Printing</h3>
            <div className="space-y-2 mb-6">
                <Label htmlFor="paper-size" className="font-semibold text-center block">Choose Paper Size</Label>
                <Select defaultValue="a4">
                  <SelectTrigger id="paper-size" className="w-full md:w-1/2 mx-auto">
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4 (8.27" x 11.69")</SelectItem>
                    <SelectItem value="a5">A5 (5.83" x 8.27")</SelectItem>
                    <SelectItem value="legal">Legal (8.5" x 14")</SelectItem>
                    <SelectItem value="letter">Letter (8.5" x 11")</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">Black & White Print</TableCell>
                        <TableCell className="text-right">₹3 / page</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Color Print</TableCell>
                        <TableCell className="text-right">₹5 / page</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </div>

          <Separator />

          <div>
             <h3 className="text-lg font-semibold mb-4 text-center">Photo Printing</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                    <Label>Photo Size (in inches)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="photo-width" type="number" placeholder="Width" />
                        <span>x</span>
                        <Input id="photo-height" type="number" placeholder="Height" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo-quantity">Quantity</Label>
                    <Input id="photo-quantity" type="number" min="1" placeholder="Number of photos" />
                </div>
             </div>
             <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">Glossy Photo Paper</TableCell>
                        <TableCell className="text-right">₹15 / photo</TableCell>
                    </TableRow>
                 </TableBody>
             </Table>
          </div>
           <Separator />
           <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Delivery</h3>
             <Table>
                <TableBody>
                    <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">
                        Standard Delivery Fee
                        </TableCell>
                        <TableCell className="text-right">₹30 - ₹60</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
             <p className="text-xs text-muted-foreground mt-4 text-center">
                Delivery fees may vary based on your location. Service available for all plans.
            </p>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
