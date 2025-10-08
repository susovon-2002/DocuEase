
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
import { Printer, UploadCloud, X, CreditCard, QrCode, Wallet, HandCoins, ShoppingCart } from "lucide-react";
import { Separator } from "./ui/separator";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
import { renderPdfPagesToImageUrls } from "@/lib/pdf-utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { PagePreviewDialog } from "./PagePreviewDialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


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
    'hd': 4,
};

const deliveryCharges: Record<string, number> = {
    'standard': 45, // Using an average of 30-60
    'express': 100,
};

const BW_PRICE_PER_PAGE = 3;
const COLOR_PRICE_PER_PAGE = 5;

type UploadedDoc = {
  name: string;
  thumbnailUrls: string[];
}

export function PrintDeliveryOptions() {
  const [photoWidth, setPhotoWidth] = useState('3.5');
  const [photoHeight, setPhotoHeight] = useState('4.5');
  const [photoQuantity, setPhotoQuantity] = useState('20');
  const [paperType, setPaperType] = useState('photo');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [bwPages, setBwPages] = useState('0');
  const [colorPages, setColorPages] = useState('0');
  const [docQuantity, setDocQuantity] = useState('1');

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');


  const docFileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalDocPages = useMemo(() => {
    return uploadedDocs.reduce((acc, doc) => acc + doc.thumbnailUrls.length, 0);
  }, [uploadedDocs]);

  useEffect(() => {
    if (totalDocPages > 0) {
      setColorPages(String(totalDocPages));
      setBwPages('0');
    } else {
      setColorPages('0');
      setBwPages('0');
    }
  }, [totalDocPages]);

  const handleDocFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newDocs: UploadedDoc[] = [];
    for (const file of Array.from(files)) {
        if(file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: 'Invalid File', description: `${file.name} is not a PDF.` });
            continue;
        }
        
        try {
            const fileBuffer = await file.arrayBuffer();
            const thumbnailUrls = await renderPdfPagesToImageUrls(new Uint8Array(fileBuffer.slice(0)));
            newDocs.push({ name: file.name, thumbnailUrls });
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error Reading PDF', description: `Could not process ${file.name}.` });
        }
    }
    
    if (newDocs.length > 0) {
        setUploadedDocs(currentDocs => [...currentDocs, ...newDocs]);
        toast({ title: 'Documents Added', description: `Added ${newDocs.length} document(s).` });
    }

    if (docFileInputRef.current) {
        docFileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (docIndex: number) => {
    setUploadedDocs(currentDocs => {
      const docToRemove = currentDocs[docIndex];
      if (docToRemove) {
        docToRemove.thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
      }
      return currentDocs.filter((_, i) => i !== docIndex);
    });
  };

  const handleRemovePage = (docIndex: number, pageIndex: number) => {
    setUploadedDocs(currentDocs => {
      const newDocs = [...currentDocs];
      const targetDoc = newDocs[docIndex];

      if (targetDoc) {
        // Revoke the object URL to prevent memory leaks
        const urlToRemove = targetDoc.thumbnailUrls[pageIndex];
        URL.revokeObjectURL(urlToRemove);

        // Filter out the page to be removed
        targetDoc.thumbnailUrls = targetDoc.thumbnailUrls.filter((_, i) => i !== pageIndex);

        // If the document has no pages left, remove the document itself
        if (targetDoc.thumbnailUrls.length === 0) {
          return newDocs.filter((_, i) => i !== docIndex);
        }
      }
      return newDocs;
    });
  };
  
  const handlePhotoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
          toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file.' });
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
              // Assuming 96 DPI for conversion from pixels to cm
              const dpi = 96;
              const widthInCm = (img.width * 2.54) / dpi;
              const heightInCm = (img.height * 2.54) / dpi;
              setPhotoWidth(widthInCm.toFixed(1));
              setPhotoHeight(heightInCm.toFixed(1));
              toast({ title: 'Image Loaded', description: 'Photo dimensions have been set from the uploaded image.' });
          };
          img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
  };

  const handlePageCountChange = (value: string, type: 'bw' | 'color') => {
    const numValue = parseInt(value, 10);
    if (value === '' || (numValue >= 0 && numValue <= totalDocPages)) {
      if (type === 'bw') {
        setBwPages(value);
        if(numValue + parseInt(colorPages, 10) > totalDocPages) {
            setColorPages(String(totalDocPages - numValue));
        }
      } else {
        setColorPages(value);
        if(numValue + parseInt(bwPages, 10) > totalDocPages) {
            setBwPages(String(totalDocPages - numValue));
        }
      }
    }
  };


  const photoPrice = useMemo(() => {
    const width = parseFloat(photoWidth);
    const height = parseFloat(photoHeight);
    const quantity = parseInt(photoQuantity, 10);

    if (isNaN(width) || isNaN(height) || isNaN(quantity) || width <= 0 || height <= 0 || quantity <= 0) {
      return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, error: null };
    }

    const photosPerPageX = Math.floor(A4_PRINTABLE_WIDTH / width);
    const photosPerPageY = Math.floor(A4_PRINTABLE_HEIGHT / height);
    const photosPerPage = photosPerPageX * photosPerPageY;

    if (photosPerPage === 0) {
         return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, error: "Photo size is too large for an A4 sheet." };
    }

    const pagesRequired = Math.ceil(quantity / photosPerPage);
    const basePricePerPhoto = getPricePerPhoto(width, height);
    const paperAddon = paperTypeAddons[paperType] || 0;
    const finalPricePerPhoto = basePricePerPhoto + paperAddon;
    
    const printingCost = quantity * finalPricePerPhoto;

    return { photosPerPage, pagesRequired, pricePerPhoto: finalPricePerPhoto, printingCost, error: null };
  }, [photoWidth, photoHeight, photoQuantity, paperType]);
  
 const documentPrintingCost = useMemo(() => {
    const numBw = parseInt(bwPages, 10) || 0;
    const numColor = parseInt(colorPages, 10) || 0;
    const quantity = parseInt(docQuantity, 10) || 1;

    if ((numBw + numColor) > totalDocPages) {
      return { bwCost: 0, colorCost: 0, printingSubtotal: 0, error: "Page count exceeds total pages." };
    }
    
    if (totalDocPages === 0 || quantity <=0) {
        return { bwCost: 0, colorCost: 0, printingSubtotal: 0, error: null };
    }
    
    const bwCost = numBw * BW_PRICE_PER_PAGE;
    const colorCost = numColor * COLOR_PRICE_PER_PAGE;
    const printingSubtotal = (bwCost + colorCost) * quantity;
    
    return { bwCost, colorCost, printingSubtotal, error: null };
  }, [bwPages, colorPages, docQuantity, totalDocPages]);

  const finalCost = useMemo(() => {
      const docSubtotal = documentPrintingCost.printingSubtotal;
      const photoSubtotal = photoPrice.printingCost;
      
      const subtotal = docSubtotal + photoSubtotal;
      
      if (subtotal === 0) {
          return {
              docSubtotal,
              photoSubtotal,
              deliveryCharge: 0,
              grandTotal: 0
          };
      }
      
      const deliveryCharge = deliveryCharges[deliveryOption] || 0;
      const grandTotal = subtotal + deliveryCharge;
      
      return {
          docSubtotal,
          photoSubtotal,
          deliveryCharge,
          grandTotal
      };
  }, [documentPrintingCost, photoPrice, deliveryOption]);


  return (
    <>
      <PagePreviewDialog
        imageUrl={previewImageUrl}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPreviewImageUrl(null);
          }
        }}
      />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                      <input type="file" ref={docFileInputRef} onChange={handleDocFileUpload} className="hidden" accept="application/pdf" multiple />
                      <Button variant="outline" className="w-full" onClick={() => docFileInputRef.current?.click()}>
                          <UploadCloud className="mr-2 h-4 w-4" /> Upload Document(s)
                      </Button>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="doc-quantity">Number of Copies</Label>
                      <Input 
                          id="doc-quantity" 
                          type="number" 
                          min="1" 
                          value={docQuantity} 
                          onChange={(e) => setDocQuantity(e.target.value)}
                          disabled={totalDocPages === 0}
                      />
                  </div>
              </div>

              {uploadedDocs.length > 0 && (
                  <div className="mb-4 space-y-4">
                      <h4 className="text-sm font-semibold mb-2">Uploaded Documents ({uploadedDocs.length}):</h4>
                      {uploadedDocs.map((doc, docIndex) => (
                          <div key={docIndex} className="relative group p-4 rounded-md bg-muted/50 border">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm truncate font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.thumbnailUrls.length} pages</p>
                              </div>
                              <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemoveDoc(docIndex)}>
                                  <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <ScrollArea>
                              <div className="flex space-x-4 pb-4">
                                  {doc.thumbnailUrls.map((url, pageIndex) => (
                                      <div key={pageIndex} className="w-32 flex-shrink-0 group/page relative">
                                          <img
                                            src={url}
                                            alt={`${doc.name} page ${pageIndex + 1}`}
                                            className="rounded-md w-full aspect-[2/3] object-contain bg-white border cursor-pointer"
                                            onClick={() => setPreviewImageUrl(url)}
                                          />
                                          <p className="text-center text-xs mt-1 text-muted-foreground">Page {pageIndex + 1}</p>
                                          <Button 
                                              variant="destructive" 
                                              size="icon" 
                                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/page:opacity-100 transition-opacity"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemovePage(docIndex, pageIndex);
                                              }}
                                          >
                                              <X className="h-3 w-3" />
                                          </Button>
                                      </div>
                                  ))}
                              </div>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          </div>
                      ))}
                  </div>
              )}

             {totalDocPages > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bw-pages">Black &amp; White Pages</Label>
                      <Input
                        id="bw-pages"
                        type="number"
                        min="0"
                        max={totalDocPages}
                        value={bwPages}
                        onChange={(e) => handlePageCountChange(e.target.value, 'bw')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color-pages">Color Pages</Label>
                      <Input
                        id="color-pages"
                        type="number"
                        min="0"
                        max={totalDocPages}
                        value={colorPages}
                        onChange={(e) => handlePageCountChange(e.target.value, 'color')}
                      />
                    </div>
                  </div>
                  {(parseInt(bwPages, 10) + parseInt(colorPages, 10)) > totalDocPages && (
                    <p className="text-sm text-destructive">Total page count cannot exceed {totalDocPages}.</p>
                  )}

                  {documentPrintingCost.printingSubtotal > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-2 text-center">Document Printing Cost</h4>
                      <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>B&amp;W Pages ({bwPages} x ₹{BW_PRICE_PER_PAGE}/page)</TableCell>
                                <TableCell className="text-right">₹{documentPrintingCost.bwCost.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Color Pages ({colorPages} x ₹{COLOR_PRICE_PER_PAGE}/page)</TableCell>
                                <TableCell className="text-right">₹{documentPrintingCost.colorCost.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Subtotal</TableCell>
                                <TableCell className="text-right">₹{(documentPrintingCost.bwCost + documentPrintingCost.colorCost).toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Copies</TableCell>
                                <TableCell className="text-right">x {docQuantity}</TableCell>
                              </TableRow>
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell>Document Printing Total</TableCell>
                                <TableCell className="text-right">₹{documentPrintingCost.printingSubtotal.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">Photo Printing Calculator</h3>
                <div className="mb-4">
                  <input type="file" ref={photoFileInputRef} onChange={handlePhotoFileUpload} className="hidden" accept="image/*"/>
                  <Button variant="outline" className="w-full" onClick={() => photoFileInputRef.current?.click()}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Photo to Auto-fill Dimensions
                  </Button>
              </div>
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
                              <SelectItem value="hd">HD Paper (+₹4/photo)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              
              <div className="mt-6">
                  <h4 className="text-md font-semibold mb-2 text-center">Photo Printing Cost</h4>
                  {photoPrice.error ? (
                      <p className="text-center text-red-500 font-medium">{photoPrice.error}</p>
                  ) : photoPrice.printingCost > 0 ? (
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
                              <TableRow className="font-bold bg-muted/50">
                                  <TableCell>Photo Printing Total</TableCell>
                                  <TableCell className="text-right text-lg">₹{photoPrice.printingCost.toFixed(2)}</TableCell>
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
            <Separator />
             <div>
                <h3 className="text-xl font-semibold mb-4 text-center">Grand Total</h3>
                 <Table>
                    <TableBody>
                        {finalCost.docSubtotal > 0 && (
                            <TableRow>
                                <TableCell>Document Printing Subtotal</TableCell>
                                <TableCell className="text-right">₹{finalCost.docSubtotal.toFixed(2)}</TableCell>
                            </TableRow>
                        )}
                        {finalCost.photoSubtotal > 0 && (
                            <TableRow>
                                <TableCell>Photo Printing Subtotal</TableCell>
                                <TableCell className="text-right">₹{finalCost.photoSubtotal.toFixed(2)}</TableCell>
                            </TableRow>
                        )}
                         {finalCost.grandTotal > 0 && (
                            <TableRow>
                                <TableCell>Delivery Fee ({deliveryOption})</TableCell>
                                <TableCell className="text-right">₹{finalCost.deliveryCharge.toFixed(2)}</TableCell>
                            </TableRow>
                         )}
                        <TableRow className="font-bold bg-primary/10 text-lg">
                            <TableCell>Total Order Cost</TableCell>
                            <TableCell className="text-right">₹{finalCost.grandTotal.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <Separator />
             <div>
                <h3 className="text-lg font-semibold mb-4 text-center">Payment Method</h3>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                        <Label htmlFor="upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <Wallet className="mb-2 h-6 w-6" />
                            UPI
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="netbanking" id="netbanking" className="peer sr-only" />
                        <Label htmlFor="netbanking" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <CreditCard className="mb-2 h-6 w-6" />
                            Net Banking
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="qrcode" id="qrcode" className="peer sr-only" />
                        <Label htmlFor="qrcode" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <QrCode className="mb-2 h-6 w-6" />
                            QR Code
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                        <Label htmlFor="cod" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <HandCoins className="mb-2 h-6 w-6" />
                            COD
                        </Label>
                    </div>
                </RadioGroup>
                <div className="flex justify-center mt-6">
                    <Button size="lg" disabled={finalCost.grandTotal <= 0}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Proceed to Pay ₹{finalCost.grandTotal.toFixed(2)}
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
