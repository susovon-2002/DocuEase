
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
import { Printer, UploadCloud, X, CreditCard, QrCode, Wallet, HandCoins, ShoppingCart, User, Phone, Mail, MapPin, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { renderPdfPagesToImageUrls } from "@/lib/pdf-utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PagePreviewDialog } from "@/components/PagePreviewDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";


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

type UploadedPhoto = {
  name: string;
  url: string;
}

const initialAddressState = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  pincode: '',
};

type DocumentInvoiceDetails = {
    bwPages: number;
    colorPages: number;
    copies: number;
};

type PhotoInvoiceDetails = {
    quantity: number;
    width: string;
    height: string;
    paperType: string;
    pricePerPhoto: number;
};

type PaymentDetails = {
  orderType: 'Document' | 'Photo' | null;
  amount: number;
}


export default function PrintDeliveryPage() {
  // Photo State
  const [photoWidth, setPhotoWidth] = useState('3.5');
  const [photoHeight, setPhotoHeight] = useState('4.5');
  const [photoQuantity, setPhotoQuantity] = useState('1');
  const [paperType, setPaperType] = useState('photo');
  const [photoDeliveryOption, setPhotoDeliveryOption] = useState('standard');
  const [photoPaymentMethod, setPhotoPaymentMethod] = useState('upi');
  const [photoDeliveryAddress, setPhotoDeliveryAddress] = useState(initialAddressState);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);


  // Document State
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [bwPages, setBwPages] = useState('0');
  const [colorPages, setColorPages] = useState('0');
  const [docQuantity, setDocQuantity] = useState('1');
  const [docDeliveryOption, setDocDeliveryOption] = useState('standard');
  const [docPaymentMethod, setDocPaymentMethod] = useState('upi');
  const [docDeliveryAddress, setDocDeliveryAddress] = useState(initialAddressState);


  // General State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ orderType: null, amount: 0 });

  const docFileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalDocPages = useMemo(() => {
    return uploadedDocs.reduce((acc, doc) => acc + doc.thumbnailUrls.length, 0);
  }, [uploadedDocs]);

  useEffect(() => {
    if (totalDocPages > 0) {
      const currentBw = parseInt(bwPages, 10) || 0;
      const currentColor = parseInt(colorPages, 10) || 0;
      if (currentBw + currentColor !== totalDocPages) {
        setColorPages(String(totalDocPages));
        setBwPages('0');
      }
    } else {
      setColorPages('0');
      setBwPages('0');
    }
  }, [totalDocPages, bwPages, colorPages]);

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
        const urlToRemove = targetDoc.thumbnailUrls[pageIndex];
        URL.revokeObjectURL(urlToRemove);
        targetDoc.thumbnailUrls = targetDoc.thumbnailUrls.filter((_, i) => i !== pageIndex);

        if (targetDoc.thumbnailUrls.length === 0) {
          return newDocs.filter((_, i) => i !== docIndex);
        }
      }
      return newDocs;
    });
  };
  
 const handlePhotoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: UploadedPhoto[] = [];
    let firstImageProcessed = false;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file.' });
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        newPhotos.push({ name: file.name, url: imgUrl });

        // Auto-fill dimensions from the first image in the batch
        if (!firstImageProcessed) {
          const img = new Image();
          img.onload = () => {
            const dpi = 96;
            const widthInCm = (img.width * 2.54) / dpi;
            const heightInCm = (img.height * 2.54) / dpi;
            setPhotoWidth(widthInCm.toFixed(1));
            setPhotoHeight(heightInCm.toFixed(1));
          };
          img.src = imgUrl;
          firstImageProcessed = true;
        }

        // When the last file is read, update the state
        if (newPhotos.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            setUploadedPhotos(prev => [...prev, ...newPhotos]);
            toast({ title: `${newPhotos.length} Image(s) Loaded` });
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (photoFileInputRef.current) {
        photoFileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoIndex: number) => {
    setUploadedPhotos(currentPhotos => {
      const photoToRemove = currentPhotos[photoIndex];
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return currentPhotos.filter((_, i) => i !== photoIndex);
    });
  };

  const handlePageCountChange = (value: string, type: 'bw' | 'color') => {
    const numValue = parseInt(value, 10) || 0;
    if (value === '' || (numValue >= 0 && numValue <= totalDocPages)) {
      if (type === 'bw') {
        setBwPages(value);
        setColorPages(String(totalDocPages - numValue));
      } else {
        setColorPages(value);
        setBwPages(String(totalDocPages - numValue));
      }
    }
  };
  
  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    type: 'doc' | 'photo'
  ) => {
    const { name, value } = e.target;
    if (type === 'doc') {
      setDocDeliveryAddress(prev => ({ ...prev, [name]: value }));
    } else {
      setPhotoDeliveryAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const photoPrice = useMemo(() => {
    const width = parseFloat(photoWidth);
    const height = parseFloat(photoHeight);
    const quantityPerPhoto = parseInt(photoQuantity, 10);
    const numberOfPhotos = uploadedPhotos.length;

    if (isNaN(width) || isNaN(height) || isNaN(quantityPerPhoto) || width <= 0 || height <= 0 || quantityPerPhoto <= 0 || numberOfPhotos === 0) {
      return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, error: null };
    }

    const photosPerPageX = Math.floor(A4_PRINTABLE_WIDTH / width);
    const photosPerPageY = Math.floor(A4_PRINTABLE_HEIGHT / height);
    const photosPerPage = photosPerPageX * photosPerPageY;

    if (photosPerPage === 0) {
         return { photosPerPage: 0, pagesRequired: 0, pricePerPhoto: 0, printingCost: 0, error: "Photo size is too large for an A4 sheet." };
    }
    
    const totalPhotoCount = numberOfPhotos * quantityPerPhoto;
    const pagesRequired = Math.ceil(totalPhotoCount / photosPerPage);
    const basePricePerPhoto = getPricePerPhoto(width, height);
    const paperAddon = paperTypeAddons[paperType] || 0;
    const finalPricePerPhoto = basePricePerPhoto + paperAddon;
    
    const printingCost = totalPhotoCount * finalPricePerPhoto;

    return { photosPerPage, pagesRequired, pricePerPhoto: finalPricePerPhoto, printingCost, error: null };
  }, [photoWidth, photoHeight, photoQuantity, paperType, uploadedPhotos.length]);
  
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

  const documentOrderTotal = useMemo(() => {
    const subtotal = documentPrintingCost.printingSubtotal;
    if (subtotal === 0) return 0;
    const deliveryCharge = deliveryCharges[docDeliveryOption] || 0;
    return subtotal + deliveryCharge;
  }, [documentPrintingCost, docDeliveryOption]);

  const photoOrderTotal = useMemo(() => {
    const subtotal = photoPrice.printingCost;
    if (subtotal === 0) return 0;
    const deliveryCharge = deliveryCharges[photoDeliveryOption] || 0;
    return subtotal + deliveryCharge;
  }, [photoPrice, photoDeliveryOption]);

  const isAddressComplete = (address: typeof initialAddressState) => {
    return address.name && address.mobile && address.email && address.address && address.pincode;
  }

  const isDocAddressComplete = useMemo(() => isAddressComplete(docDeliveryAddress), [docDeliveryAddress]);
  const isPhotoAddressComplete = useMemo(() => isAddressComplete(photoDeliveryAddress), [photoDeliveryAddress]);


  const generateInvoicePdf = async (
    orderType: 'Document' | 'Photo',
    address: typeof initialAddressState,
    details: DocumentInvoiceDetails | PhotoInvoiceDetails,
    subtotal: number,
    deliveryCharge: number,
    total: number
  ) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const primaryColor = rgb(0.25, 0.55, 0.95);
    const grayColor = rgb(0.3, 0.3, 0.3);
    const lightGrayColor = rgb(0.95, 0.95, 0.95);
    const whiteColor = rgb(1, 1, 1);

    // Watermark
    const watermarkText = 'DocuEase';
    const watermarkFontSize = 80;
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const textWidth = watermarkFont.widthOfTextAtSize(watermarkText, watermarkFontSize);
    
    const drawWatermark = (x: number, y: number) => {
        page.drawText(watermarkText, {
            x,
            y,
            font: watermarkFont,
            size: watermarkFontSize,
            color: rgb(0.85, 0.85, 0.85),
            opacity: 0.2,
            rotate: degrees(-45),
        });
    }

    drawWatermark(width * 0.1 - textWidth / 2, height * 0.6);
    drawWatermark(width * 0.7 - textWidth / 2, height * 0.8);
    drawWatermark(width * 0.2 - textWidth / 2, height * 0.15);
    drawWatermark(width * 0.6 - textWidth / 2, height * 0.3);


    // Header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: primaryColor,
    });
    page.drawText('DocuEase', {
      x: 50,
      y: height - 68,
      font: boldFont,
      size: 32,
      color: whiteColor,
    });


    // Invoice Info
    let infoY = height - 40;
    page.drawText('INVOICE', { x: 450, y: infoY, font: boldFont, size: 20, color: whiteColor });
    infoY -= 20;
    page.drawText(`Order Type: ${orderType} Printing`, { x: 450, y: infoY, font: font, size: 8, color: whiteColor });
    infoY -= 12;
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 450, y: infoY, font: font, size: 8, color: whiteColor });
    

    // Bill To Section
    let billToY = height - 140;
    page.drawText('BILL TO', { x: 50, y: billToY, font: boldFont, size: 12, color: primaryColor });
    billToY -= 20;
    page.drawText(address.name, { x: 50, y: billToY, font: boldFont, size: 11 });
    billToY -= 15;
    page.drawText(address.address, { x: 50, y: billToY, font: font, size: 10, color: grayColor });
    billToY -= 15;
    page.drawText(address.pincode, { x: 50, y: billToY, font: font, size: 10, color: grayColor });
    billToY -= 15;
    page.drawText(address.email, { x: 50, y: billToY, font: font, size: 10, color: grayColor });
    billToY -= 15;
    page.drawText(address.mobile, { x: 50, y: billToY, font: font, size: 10, color: grayColor });
    
    // Company Address
    let companyY = height - 140;
    page.drawText('FROM', { x: 350, y: companyY, font: boldFont, size: 12, color: primaryColor });
    companyY -= 20;
    page.drawText('DocuEase', { x: 350, y: companyY, font: boldFont, size: 11 });
    companyY -= 15;
    page.drawText('Sector v, Bidhannagar, Near Technopolis', { x: 350, y: companyY, font: font, size: 10, color: grayColor });
    companyY -= 15;
    page.drawText('kolkata 700091', { x: 350, y: companyY, font: font, size: 10, color: grayColor });
    companyY -= 15;
    page.drawText('susovonsantra4@gmail.com', { x: 350, y: companyY, font: font, size: 10, color: grayColor });
    companyY -= 15;
    page.drawText('ph.no 8910819035', { x: 350, y: companyY, font: font, size: 10, color: grayColor });


    // Table Header
    let tableY = billToY - 50;
    page.drawRectangle({ x: 50, y: tableY - 10, width: width - 100, height: 25, color: lightGrayColor });
    page.drawText('Item Description', { x: 60, y: tableY, font: boldFont, size: 11, color: grayColor });
    page.drawText('Qty', { x: 350, y: tableY, font: boldFont, size: 11, color: grayColor });
    page.drawText('Amount', { x: 450, y: tableY, font: boldFont, size: 11, color: grayColor });
    tableY -= 30;

    // Table Rows
    if (orderType === 'Document' && 'bwPages' in details) {
        if (details.bwPages > 0) {
            page.drawText(`B&W Pages (at Rs. ${BW_PRICE_PER_PAGE}/page)`, { x: 60, y: tableY, font: font, size: 10 });
            page.drawText(`${details.bwPages}`, { x: 350, y: tableY, font: font, size: 10 });
            page.drawText(`Rs. ${(details.bwPages * BW_PRICE_PER_PAGE).toFixed(2)}`, { x: 450, y: tableY, font: font, size: 10 });
            tableY -= 20;
        }
        if (details.colorPages > 0) {
            page.drawText(`Color Pages (at Rs. ${COLOR_PRICE_PER_PAGE}/page)`, { x: 60, y: tableY, font: font, size: 10 });
            page.drawText(`${details.colorPages}`, { x: 350, y: tableY, font: font, size: 10 });
            page.drawText(`Rs. ${(details.colorPages * COLOR_PRICE_PER_PAGE).toFixed(2)}`, { x: 450, y: tableY, font: font, size: 10 });
            tableY -= 20;
        }
    } else if (orderType === 'Photo' && 'quantity' in details) {
        page.drawText(`Photos ${details.width}x${details.height}cm (${details.paperType})`, { x: 60, y: tableY, font: font, size: 10 });
        page.drawText(`${details.quantity}`, { x: 350, y: tableY, font: font, size: 10 });
        page.drawText(`Rs. ${subtotal.toFixed(2)}`, { x: 450, y: tableY, font: font, size: 10 });
        tableY -= 20;
    }
    
    // Totals Section
    let totalY = tableY - 20;
    
    if(orderType === 'Document' && 'copies' in details) {
        const printingSubtotal = ((details.bwPages * BW_PRICE_PER_PAGE) + (details.colorPages * COLOR_PRICE_PER_PAGE));
        page.drawText('Subtotal:', { x: 350, y: totalY, font: font, size: 10 });
        page.drawText(`Rs. ${printingSubtotal.toFixed(2)}`, { x: 450, y: totalY, font: font, size: 10 });
        totalY -= 20;
        page.drawText('Copies:', { x: 350, y: totalY, font: font, size: 10 });
        page.drawText(`x ${details.copies}`, { x: 450, y: totalY, font: font, size: 10 });
        totalY -= 20;
    } else {
        page.drawText('Subtotal:', { x: 350, y: totalY, font: font, size: 10 });
        page.drawText(`Rs. ${subtotal.toFixed(2)}`, { x: 450, y: totalY, font: font, size: 10 });
        totalY -= 20;
    }

    page.drawText(`Delivery Fee:`, { x: 350, y: totalY, font: font, size: 10 });
    page.drawText(`Rs. ${deliveryCharge.toFixed(2)}`, { x: 450, y: totalY, font: font, size: 10 });
    totalY -= 20;
    
    page.drawLine({ start: { x: 340, y: totalY }, end: { x: width - 50, y: totalY }, thickness: 1, color: grayColor });
    totalY -= 20;

    page.drawText('Grand Total:', { x: 350, y: totalY, font: boldFont, size: 12 });
    page.drawText(`Rs. ${total.toFixed(2)}`, { x: 450, y: totalY, font: boldFont, size: 12 });
    
    // Footer
    let footerY = 40;
    page.drawRectangle({ x: 0, y: 0, width, height: 60, color: lightGrayColor });
    page.drawText('Thank you for your business!', { x: 50, y: footerY, font: boldFont, size: 12, color: grayColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleGenerateDocInvoice = () => {
    if (!isDocAddressComplete) {
      toast({
        variant: "destructive",
        title: "Incomplete Address",
        description: "Please fill out all delivery details before generating an invoice.",
      });
      return;
    }

    const details: DocumentInvoiceDetails = {
        bwPages: parseInt(bwPages, 10) || 0,
        colorPages: parseInt(colorPages, 10) || 0,
        copies: parseInt(docQuantity, 10) || 1,
    };
    
    generateInvoicePdf(
      'Document',
      docDeliveryAddress,
      details,
      (details.bwPages * BW_PRICE_PER_PAGE) + (details.colorPages * COLOR_PRICE_PER_PAGE),
      deliveryCharges[docDeliveryOption] || 0,
      documentOrderTotal
    );
  };

  const handleGeneratePhotoInvoice = () => {
     if (!isPhotoAddressComplete) {
      toast({
        variant: "destructive",
        title: "Incomplete Address",
        description: "Please fill out all delivery details before generating an invoice.",
      });
      return;
    }
    const details: PhotoInvoiceDetails = {
      quantity: (parseInt(photoQuantity, 10) || 0) * uploadedPhotos.length,
      width: photoWidth,
      height: photoHeight,
      paperType: paperType,
      pricePerPhoto: photoPrice.pricePerPhoto
    };

    generateInvoicePdf(
      'Photo',
      photoDeliveryAddress,
      details,
      photoPrice.printingCost,
      deliveryCharges[photoDeliveryOption] || 0,
      photoOrderTotal
    );
  };

  const handleProceedToPay = (orderType: 'Document' | 'Photo', amount: number) => {
    setPaymentDetails({ orderType, amount });
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsPaying(true);
    // Simulate API call
    setTimeout(() => {
        setIsPaying(false);
        setPaymentDialogOpen(false);
        toast({
            title: "Payment Successful!",
            description: `Your order for ${paymentDetails.orderType} printing has been placed.`,
        });
        // Reset the relevant form
        if (paymentDetails.orderType === 'Document') {
            setUploadedDocs([]);
            setBwPages('0');
            setColorPages('0');
            setDocQuantity('1');
            setDocDeliveryAddress(initialAddressState);
        } else {
            setUploadedPhotos([]);
            setPhotoWidth('3.5');
            setPhotoHeight('4.5');
            setPhotoQuantity('1');
            setPhotoDeliveryAddress(initialAddressState);
        }
    }, 2000);
  };

  
  const renderAddressForm = (
    type: 'doc' | 'photo',
    address: typeof initialAddressState,
    onAddressChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: 'doc' | 'photo') => void
  ) => (
    <>
      <h4 className="text-md font-semibold mb-4 text-center">Delivery Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}-name`}><User className="inline-block mr-2 h-4 w-4" />Full Name</Label>
          <Input id={`${type}-name`} name="name" value={address.name} onChange={e => onAddressChange(e, type)} placeholder="Enter your full name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-mobile`}><Phone className="inline-block mr-2 h-4 w-4" />Mobile Number</Label>
          <Input id={`${type}-mobile`} name="mobile" value={address.mobile} onChange={e => onAddressChange(e, type)} placeholder="Enter your mobile number" />
        </div>
         <div className="space-y-2">
          <Label htmlFor={`${type}-email`}><Mail className="inline-block mr-2 h-4 w-4" />Email Address</Label>
          <Input id={`${type}-email`} name="email" value={address.email} onChange={e => onAddressChange(e, type)} placeholder="Enter your email address" />
        </div>
         <div className="space-y-2">
          <Label htmlFor={`${type}-pincode`}><MapPin className="inline-block mr-2 h-4 w-4" />Pincode</Label>
          <Input id={`${type}-pincode`} name="pincode" value={address.pincode} onChange={e => onAddressChange(e, type)} placeholder="Enter your pincode" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor={`${type}-address`}><MapPin className="inline-block mr-2 h-4 w-4" />Full Address</Label>
          <Textarea id={`${type}-address`} name="address" value={address.address} onChange={e => onAddressChange(e, type)} placeholder="Enter your full street address" />
        </div>
      </div>
    </>
  );

  const a4Preview = useMemo(() => {
    const widthCm = parseFloat(photoWidth);
    const heightCm = parseFloat(photoHeight);
    if (isNaN(widthCm) || isNaN(heightCm) || widthCm <= 0 || heightCm <= 0) {
      return { previewPhotos: [], error: 'Invalid dimensions' };
    }

    const A4_WIDTH_PX = 595;
    const A4_HEIGHT_PX = 842;
    const CM_TO_PX = A4_WIDTH_PX / 21; // approx 28.35

    const photoWidthPx = widthCm * CM_TO_PX;
    const photoHeightPx = heightCm * CM_TO_PX;
    
    if (photoWidthPx > A4_WIDTH_PX || photoHeightPx > A4_HEIGHT_PX) {
      return { previewPhotos: [], error: "Photo size exceeds A4." };
    }

    const cols = Math.floor(A4_WIDTH_PX / photoWidthPx);
    const rows = Math.floor(A4_HEIGHT_PX / photoHeightPx);
    const photosPerPage = cols * rows;

    if (photosPerPage === 0) {
        return { previewPhotos: [], error: "Photo size is too large to fit on A4." };
    }

    return { 
        previewPhotos: Array.from({ length: photosPerPage }, (_, i) => i),
        photoWidthPx,
        photoHeightPx,
        error: null 
    };

  }, [photoWidth, photoHeight]);


  return (
    <div className="py-12">
      <PagePreviewDialog
        imageUrl={previewImageUrl}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPreviewImageUrl(null);
          }
        }}
      />
      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirm Payment</DialogTitle>
                  <DialogDescription>
                      You are about to pay for your {paymentDetails.orderType} printing order.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center">
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="text-4xl font-bold">Rs. {paymentDetails.amount.toFixed(2)}</p>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isPaying}>Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleConfirmPayment} disabled={isPaying}>
                      {isPaying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm Payment'
                      )}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Printer className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Print &amp; Delivery Service</CardTitle>
          <CardDescription>
            Get physical copies of your documents delivered right to your
            doorstep.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Document Printing Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Document Printing</h3>
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
                  <div className="space-y-2">
                      <Label htmlFor="doc-delivery-option">Delivery Speed</Label>
                      <Select value={docDeliveryOption} onValueChange={setDocDeliveryOption}>
                          <SelectTrigger id="doc-delivery-option">
                              <SelectValue placeholder="Select delivery speed" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="standard">Standard (Rs. 45)</SelectItem>
                              <SelectItem value="express">Express (Rs. 100)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  {documentPrintingCost.printingSubtotal > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-2 text-center">Document Printing Cost</h4>
                      <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>B&amp;W Pages ({bwPages} x Rs. {BW_PRICE_PER_PAGE}/page)</TableCell>
                                <TableCell className="text-right">Rs. {documentPrintingCost.bwCost.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Color Pages ({colorPages} x Rs. {COLOR_PRICE_PER_PAGE}/page)</TableCell>
                                <TableCell className="text-right">Rs. {documentPrintingCost.colorCost.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Subtotal</TableCell>
                                <TableCell className="text-right">Rs. {(documentPrintingCost.bwCost + documentPrintingCost.colorCost).toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Copies</TableCell>
                                <TableCell className="text-right">x {docQuantity}</TableCell>
                              </TableRow>
                             <TableRow>
                                <TableCell>Delivery Fee ({docDeliveryOption})</TableCell>
                                <TableCell className="text-right">Rs. {deliveryCharges[docDeliveryOption]?.toFixed(2) || '0.00'}</TableCell>
                              </TableRow>
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell>Document Order Total</TableCell>
                                <TableCell className="text-right">Rs. {documentOrderTotal.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
               {documentOrderTotal > 0 && (
                <>
                  <Separator className="my-6" />
                  {renderAddressForm('doc', docDeliveryAddress, handleAddressChange)}
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-md font-semibold mb-4 text-center">Payment for Documents</h4>
                    <RadioGroup value={docPaymentMethod} onValueChange={setDocPaymentMethod} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Payment Options */}
                        <RadioGroupItem value="upi" id="doc-upi" className="peer sr-only" />
                        <Label htmlFor="doc-upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><Wallet className="mb-2 h-6 w-6" />UPI</Label>
                        <RadioGroupItem value="netbanking" id="doc-netbanking" className="peer sr-only" />
                        <Label htmlFor="doc-netbanking" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><CreditCard className="mb-2 h-6 w-6" />Net Banking</Label>
                        <RadioGroupItem value="qrcode" id="doc-qrcode" className="peer sr-only" />
                        <Label htmlFor="doc-qrcode" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><QrCode className="mb-2 h-6 w-6" />QR Code</Label>
                        <RadioGroupItem value="cod" id="doc-cod" className="peer sr-only" />
                        <Label htmlFor="doc-cod" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><HandCoins className="mb-2 h-6 w-6" />COD</Label>
                    </RadioGroup>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button size="lg" variant="outline" onClick={handleGenerateDocInvoice} disabled={!isDocAddressComplete}>
                            <FileText className="mr-2 h-5 w-5" />
                            Invoice
                        </Button>
                        <Button size="lg" disabled={documentOrderTotal <= 0 || !isDocAddressComplete} onClick={() => handleProceedToPay('Document', documentOrderTotal)}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Proceed to Pay Rs. {documentOrderTotal.toFixed(2)}
                        </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Photo Printing Section */}
            <div>
              <h3 className="text-xl font-semibold my-4 text-center">Photo Printing</h3>
              
              <div className="mb-4">
                <input type="file" ref={photoFileInputRef} onChange={handlePhotoFileUpload} className="hidden" accept="image/*" multiple />
                <Button variant="outline" className="w-full" onClick={() => photoFileInputRef.current?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Photos
                </Button>
              </div>

               {uploadedPhotos.length > 0 && (
                  <div className="mb-4 space-y-4">
                      <h4 className="text-sm font-semibold mb-2">Uploaded Photos ({uploadedPhotos.length}):</h4>
                        <div className="flex flex-wrap gap-4">
                          {uploadedPhotos.map((photo, index) => (
                              <div key={index} className="w-32 group/page relative">
                                <img src={photo.url} alt={photo.name} className="w-full rounded border" />
                                  <p className="text-center text-xs mt-1 text-muted-foreground truncate" title={photo.name}>{photo.name}</p>
                                  <Button 
                                      variant="destructive" 
                                      size="icon" 
                                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/page:opacity-100 transition-opacity z-10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto(index);
                                      }}
                                  >
                                      <X className="h-3 w-3" />
                                  </Button>
                              </div>
                          ))}
                        </div>
                  </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                      <div className="space-y-2 sm:col-span-2">
                          <Label>Photo Size (in cm)</Label>
                          <div className="flex items-center gap-2">
                              <Input id="photo-width" type="number" placeholder="Width" value={photoWidth} onChange={(e) => setPhotoWidth(e.target.value)} />
                              <span>x</span>
                              <Input id="photo-height" type="number" placeholder="Height" value={photoHeight} onChange={(e) => setPhotoHeight(e.target.value)} />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="photo-quantity">Copies of Each</Label>
                          <Input id="photo-quantity" type="number" min="1" placeholder="Number" value={photoQuantity} onChange={(e) => setPhotoQuantity(e.target.value)} />
                      </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="paper-type">Paper Type</Label>
                      <Select value={paperType} onValueChange={setPaperType}>
                          <SelectTrigger id="paper-type">
                              <SelectValue placeholder="Select paper type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="photo">Standard Photo Paper</SelectItem>
                              <SelectItem value="matte">Matte (+Rs. 1/photo)</SelectItem>
                              <SelectItem value="glossy">Glossy (+Rs. 2/photo)</SelectItem>
                              <SelectItem value="premium">Premium Luster (+Rs. 3/photo)</SelectItem>
                              <SelectItem value="hd">HD Paper (+Rs. 4/photo)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="photo-delivery-option">Delivery Speed</Label>
                      <Select value={photoDeliveryOption} onValueChange={setPhotoDeliveryOption}>
                          <SelectTrigger id="photo-delivery-option">
                              <SelectValue placeholder="Select delivery speed" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="standard">Standard (Rs. 45)</SelectItem>
                              <SelectItem value="express">Express (Rs. 100)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                </div>

                <div>
                   <h4 className="text-md font-semibold mb-2 text-center">A4 Page Layout Preview</h4>
                    {a4Preview.error ? (
                        <div className="aspect-[210/297] bg-muted/50 border-2 border-dashed rounded-md flex items-center justify-center text-destructive text-center p-4">
                            {a4Preview.error}
                        </div>
                    ) : (
                        <div className="aspect-[210/297] bg-muted/50 border-2 border-dashed rounded-md p-2 grid"
                             style={{
                                 gridTemplateColumns: `repeat(auto-fill, minmax(${a4Preview.photoWidthPx}px, 1fr))`,
                                 gap: '4px'
                             }}
                        >
                            {a4Preview.previewPhotos.map(i => (
                                <div key={i} className="bg-muted-foreground/20 flex items-center justify-center" style={{ height: `${a4Preview.photoHeightPx}px` }}>
                                    <ImageIcon className="text-muted-foreground/50" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
              
              <div className="mt-6">
                  <h4 className="text-md font-semibold mb-2 text-center">Photo Printing Cost</h4>
                  {photoPrice.error ? (
                      <p className="text-center text-destructive font-medium">{photoPrice.error}</p>
                  ) : photoPrice.printingCost > 0 ? (
                      <Table>
                          <TableBody>
                              <TableRow>
                                  <TableCell>Price per Photo</TableCell>
                                  <TableCell className="text-right">Rs. {photoPrice.pricePerPhoto.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell>Printing Subtotal ({uploadedPhotos.length * (parseInt(photoQuantity,10) || 0)} photos)</TableCell>
                                  <TableCell className="text-right">Rs. {photoPrice.printingCost.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Delivery Fee ({photoDeliveryOption})</TableCell>
                                <TableCell className="text-right">Rs. {deliveryCharges[photoDeliveryOption]?.toFixed(2) || '0.00'}</TableCell>
                              </TableRow>
                              <TableRow className="font-bold bg-muted/50 text-lg">
                                  <TableCell>Photo Order Total</TableCell>
                                  <TableCell className="text-right">Rs. {photoOrderTotal.toFixed(2)}</TableCell>
                              </TableRow>
                          </TableBody>
                      </Table>
                  ) : (
                      <p className="text-center text-muted-foreground">Upload photos and enter dimensions to see the price.</p>
                  )}
              </div>
               {photoOrderTotal > 0 && (
                <>
                  <Separator className="my-6" />
                  {renderAddressForm('photo', photoDeliveryAddress, handleAddressChange)}
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-md font-semibold mb-4 text-center">Payment for Photos</h4>
                    <RadioGroup value={photoPaymentMethod} onValueChange={setPhotoPaymentMethod} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Payment Options */}
                        <RadioGroupItem value="upi" id="photo-upi" className="peer sr-only" />
                        <Label htmlFor="photo-upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><Wallet className="mb-2 h-6 w-6" />UPI</Label>
                        <RadioGroupItem value="netbanking" id="photo-netbanking" className="peer sr-only" />
                        <Label htmlFor="photo-netbanking" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><CreditCard className="mb-2 h-6 w-6" />Net Banking</Label>
                        <RadioGroupItem value="qrcode" id="photo-qrcode" className="peer sr-only" />
                        <Label htmlFor="photo-qrcode" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><QrCode className="mb-2 h-6 w-6" />QR Code</Label>
                        <RadioGroupItem value="cod" id="photo-cod" className="peer sr-only" />
                        <Label htmlFor="photo-cod" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><HandCoins className="mb-2 h-6 w-6" />COD</Label>
                    </RadioGroup>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button size="lg" variant="outline" onClick={handleGeneratePhotoInvoice} disabled={!isPhotoAddressComplete}>
                            <FileText className="mr-2 h-5 w-5" />
                            Invoice
                        </Button>
                        <Button size="lg" disabled={photoOrderTotal <= 0 || !isPhotoAddressComplete} onClick={() => handleProceedToPay('Photo', photoOrderTotal)}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Proceed to Pay Rs. {photoOrderTotal.toFixed(2)}
                        </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
