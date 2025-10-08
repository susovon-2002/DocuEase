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
import { useState, useMemo } from "react";

const A4_PRINTABLE_WIDTH = 20; // cm
const A4_PRINTABLE_HEIGHT = 28; // cm

// Tiered pricing based on photo area (width * height)
const getPricePerPhoto = (width: number, height: number): number => {
    const area = width * height;
    if (area <= 16) return 5; // Up to ~3.5x4.5cm
    if (area <= 35) return 8; // Up to ~5x7cm
    if (area <= 150) return 10; // Up to ~10x15cm
    if (area <= 234) return 12; // Up to ~13x18cm
    if (area <= 500) return 15; // Up to ~20x25cm
    return 20; // For larger custom sizes
};

const paperTypeAddons: Record<string, number> = {
    'photo': 0,
    'matte': 1,
    'glossy': 2,
    'premium': 3,
};

const deliveryCharges: Record<string, number> = {
    'standard': 45, // Using an average of 30-60
    'express': 100,
};

export function PrintDeliveryOptions() {
  const [photoWidth, setPhotoWidth] = useState('3.5');
  const [photoHeight, setPhotoHeight] = useState('4.5');
  const [photoQuantity, setPhotoQuantity] = useState('20');
  const [paperType, setPaperType] = useState('photo');
  const [deliveryOption, setDeliveryOption] = useState('standard');

  const photoPrice = useMemo(() => {
    const width = parseFloat(photoWidth);
    const height = parseFloat(photoHeight);
    const quantity = parseInt(photoQuantity, 10);

    if (isNaN(width) || isNaN(height) || isNaN(quantity) || width <= 0 || height <= 0 || quantity <= 0) {
      return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, totalCost: 0 };
    }

    const photosPerPageX = Math.floor(A4_PRINTABLE_WIDTH / width);
    const photosPerPageY = Math.floor(A4_PRINTABLE_HEIGHT / height);
    const photosPerPage = photosPerPageX * photosPerPageY;

    if (photosPerPage === 0) {
         return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, totalCost: 0, error: "Photo size is too large for an A4 sheet." };
    }

    const pagesRequired = Math.ceil(quantity / photosPerPage);
    const basePricePerPhoto = getPricePerPhoto(width, height);
    const paperAddon = paperTypeAddons[paperType] || 0;
    const finalPricePerPhoto = basePricePerPhoto + paperAddon;
    
    const printingCost = quantity * finalPricePerPhoto;
    const deliveryCharge = deliveryCharges[deliveryOption] || 0;
    const totalCost = printingCost + deliveryCharge;

    return { photosPerPage, pagesRequired, pricePerPhoto: finalPricePerPhoto, printingCost, totalCost, deliveryCharge, error: null };
  }, [photoWidth, photoHeight, photoQuantity, paperType, deliveryOption]);


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
             <h3 className="text-lg font-semibold mb-4 text-center">Photo Printing Calculator</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                    <Label>Photo Size (in cm)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="photo-width" type="number" placeholder="Width" value={photoWidth} onChange={(e) => setPhotoWidth(e.target.value)} />
                        <span>x</span>
                        <Input id="photo-height" type="number" placeholder="Height" value={photoHeight} onChange={(e) => setPhotoHeight(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo-quantity">Quantity</Label>
                    <Input id="photo-quantity" type="number" min="1" placeholder="Number of photos" value={photoQuantity} onChange={(e) => setPhotoQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paper-type">Paper Type</Label>
                    <Select value={paperType} onValueChange={setPaperType}>
                        <SelectTrigger id="paper-type">
                            <SelectValue placeholder="Select paper type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="photo">Standard Photo Paper</SelectItem>
                            <SelectItem value="matte">Matte (+₹1/photo)</SelectItem>
                            <SelectItem value="glossy">Glossy (+₹2/photo)</SelectItem>
                            <SelectItem value="premium">Premium Luster (+₹3/photo)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
             
             <div className="mt-6">
                <h4 className="text-md font-semibold mb-2 text-center">Cost Breakdown</h4>
                {photoPrice.error ? (
                    <p className="text-center text-red-500 font-medium">{photoPrice.error}</p>
                ) : photoPrice.totalCost > 0 ? (
                    <Table>
                        <TableBody>
                             <TableRow>
                                <TableCell>Photos per A4 Sheet</TableCell>
                                <TableCell className="text-right">{photoPrice.photosPerPage} photos</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>A4 Pages Required</TableCell>
                                <TableCell className="text-right">{photoPrice.pagesRequired} pages</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Price per Photo</TableCell>
                                <TableCell className="text-right">₹{photoPrice.pricePerPhoto.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Printing Subtotal</TableCell>
                                <TableCell className="text-right">₹{photoPrice.printingCost.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Delivery Fee ({deliveryOption})</TableCell>
                                <TableCell className="text-right">₹{photoPrice.deliveryCharge.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Estimated Cost</TableCell>
                                <TableCell className="text-right text-lg">₹{photoPrice.totalCost.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">Enter dimensions and quantity to see the price.</p>
                )}
            </div>
          </div>
           <Separator />
           <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Delivery</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                    <Label htmlFor="delivery-option">Delivery Speed</Label>
                     <Select value={deliveryOption} onValueChange={setDeliveryOption}>
                        <SelectTrigger id="delivery-option">
                            <SelectValue placeholder="Select delivery speed" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard (₹45)</SelectItem>
                            <SelectItem value="express">Express (₹100)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    Standard delivery takes 5-7 business days. Express delivery takes 2-3 business days.
                </div>
            </div>
             <p className="text-xs text-muted-foreground mt-4 text-center">
                Delivery fees may vary based on your final location and order weight. Service available for all plans.
            </p>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
