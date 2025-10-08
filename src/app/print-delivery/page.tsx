
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
import { Printer, UploadCloud, X, CreditCard, QrCode, Wallet, HandCoins, ShoppingCart, User, Phone, Mail, MapPin, FileText, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
import { CheckoutForm } from '@/components/CheckoutForm';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';


pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const DPI = 96;
const CM_TO_INCH = 0.393701;

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
  id: number;
  name: string;
  url: string;
  copies: number;
  width: string;
  height: string;
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
  orderId: string;
  address: typeof initialAddressState;
}

function PrintDeliveryContent() {
  // Photo State
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [paperType, setPaperType] = useState('photo');
  const [photoDeliveryOption, setPhotoDeliveryOption] = useState('standard');
  const [photoPaymentMethod, setPhotoPaymentMethod] = useState('upi');
  const [photoDeliveryAddress, setPhotoDeliveryAddress] = useState(initialAddressState);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);
  const [photoOrderStep, setPhotoOrderStep] = useState<'configure' | 'address' | 'payment'>('configure');


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
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  const docFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalDocPages = useMemo(() => {
    return uploadedDocs.reduce((acc, doc) => acc + doc.thumbnailUrls.length, 0);
  }, [uploadedDocs]);
  
  const totalPhotoCopies = useMemo(() => {
    return uploadedPhotos.reduce((acc, photo) => acc + photo.copies, 0);
  }, [uploadedPhotos]);

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

  const handlePhotoFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imgUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
              const widthCm = (img.width / DPI) * 2.54;
              const heightCm = (img.height / DPI) * 2.54;
              setUploadedPhotos(prev => [...prev, { 
                id: Date.now() + Math.random(), 
                name: file.name, 
                url: imgUrl, 
                copies: 1, 
                width: widthCm.toFixed(1), 
                height: heightCm.toFixed(1) 
              }]);
          };
          img.src = imgUrl;
        };
        reader.readAsDataURL(file);
      } else {
        toast({ variant: 'destructive', title: 'Invalid File', description: `${file.name} is not an image.` });
      }
    }
    if (photoFileInputRef.current) photoFileInputRef.current.value = '';
  };
  
  const handleRemovePhoto = (id: number) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== id));
  };
  
  const handlePhotoCopyChange = (id: number, copies: number) => {
    setUploadedPhotos(prev => prev.map(p => p.id === id ? { ...p, copies: copies >= 0 ? copies : 0 } : p));
  };

  const handlePhotoSizeChange = (id: number, field: 'width' | 'height', value: string) => {
    setUploadedPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

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

   const a4Preview = useMemo(() => {
    const A4_WIDTH_PX = 595;
    const A4_HEIGHT_PX = 842;
    const CM_TO_PX = A4_WIDTH_PX / 21; // Approx. conversion for display
    const PADDING = 5;

    let allPhotosToRender: { url: string; widthPx: number; heightPx: number}[] = [];
    
    uploadedPhotos.forEach(photo => {
      const widthCm = parseFloat(photo.width);
      const heightCm = parseFloat(photo.height);
      if (isNaN(widthCm) || isNaN(heightCm) || widthCm <= 0 || heightCm <= 0) return;
      
      const widthPx = widthCm * CM_TO_PX;
      const heightPx = heightCm * CM_TO_PX;

      if (widthPx > A4_WIDTH_PX - PADDING * 2 || heightPx > A4_HEIGHT_PX - PADDING * 2) {
        // Skip photos larger than the printable area for this preview
        return;
      }
      
      for (let i = 0; i < photo.copies; i++) {
        allPhotosToRender.push({
          url: photo.url,
          widthPx: widthPx,
          heightPx: heightPx,
        });
      }
    });

    if (allPhotosToRender.length === 0) {
      return { pages: [], error: null };
    }
    
    // Naive packing algorithm for preview.
    const pages: { url: string; x: number; y: number; widthPx: number; heightPx: number }[][] = [];
    let currentPage: { url: string; x: number; y: number; widthPx: number; heightPx: number }[] = [];
    let currentX = PADDING;
    let currentY = PADDING;
    let rowMaxHeight = 0;

    for (const photo of allPhotosToRender) {
      if (currentY + photo.heightPx > A4_HEIGHT_PX - PADDING) {
        // Doesn't fit on this page, push current page and start a new one
        pages.push(currentPage);
        currentPage = [];
        currentX = PADDING;
        currentY = PADDING;
        rowMaxHeight = 0;
      }
      
      if (currentX + photo.widthPx > A4_WIDTH_PX - PADDING) {
        currentX = PADDING;
        currentY += rowMaxHeight + PADDING;
        rowMaxHeight = 0;
        
        // After moving to a new row, check again if it fits vertically
         if (currentY + photo.heightPx > A4_HEIGHT_PX - PADDING) {
            pages.push(currentPage);
            currentPage = [];
            currentX = PADDING;
            currentY = PADDING;
            rowMaxHeight = 0;
         }
      }
      
      currentPage.push({ ...photo, x: currentX, y: currentY });
      currentX += photo.widthPx + PADDING;
      rowMaxHeight = Math.max(rowMaxHeight, photo.heightPx);
    }
    
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    return { pages, error: null };
  }, [uploadedPhotos]);

  useEffect(() => {
    // Reset preview page if it becomes out of bounds
    if (currentPreviewPage >= a4Preview.pages.length) {
      setCurrentPreviewPage(Math.max(0, a4Preview.pages.length - 1));
    }
  }, [currentPreviewPage, a4Preview.pages.length]);

  
  const photoOrderTotal = useMemo(() => {
    if (uploadedPhotos.length === 0) return 0;
    
    const printingCost = uploadedPhotos.reduce((total, photo) => {
        const width = parseFloat(photo.width);
        const height = parseFloat(photo.height);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0 || photo.copies <= 0) return total;
        
        const basePrice = getPricePerPhoto(width, height);
        const paperAddon = paperTypeAddons[paperType] || 0;
        return total + (photo.copies * (basePrice + paperAddon));
    }, 0);

    if (printingCost === 0) return 0;
    
    const deliveryCharge = deliveryCharges[photoDeliveryOption] || 0;
    return printingCost + deliveryCharge;
  }, [uploadedPhotos, paperType, photoDeliveryOption]);

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
      quantity: totalPhotoCopies,
      width: "mixed",
      height: "mixed",
      paperType: paperType,
      pricePerPhoto: 0 // This is simplified as total is passed directly
    };

    generateInvoicePdf(
      'Photo',
      photoDeliveryAddress,
      details,
      photoOrderTotal - (deliveryCharges[photoDeliveryOption] || 0),
      deliveryCharges[photoDeliveryOption] || 0,
      photoOrderTotal
    );
  };

  const handleProceedToPay = async (orderType: 'Document' | 'Photo', amount: number) => {
    setIsPaying(true);
    try {
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const { order } = await response.json();
      setPaymentDetails({ 
        orderType, 
        amount, 
        orderId: order.id, 
        address: orderType === 'Document' ? docDeliveryAddress : photoDeliveryAddress 
      });
      setPaymentDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Could not initiate payment. Please try again.',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setPaymentDetails(null);
    // Here you would typically save the order to your database.
    // For now, we'll just show a success message and reset the form.
    
    if (paymentDetails?.orderType === 'Document') {
        setUploadedDocs([]);
        setBwPages('0');
        setColorPages('0');
        setDocQuantity('1');
        setDocDeliveryAddress(initialAddressState);
    } else {
        setUploadedPhotos([]);
        setPhotoDeliveryAddress(initialAddressState);
        setPhotoOrderStep('configure');
    }
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
                  <DialogTitle>Complete Your Payment</DialogTitle>
                  <DialogDescription>
                      Securely enter your payment details below to complete the order for your {paymentDetails?.orderType} printing.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  {paymentDetails && (
                      <CheckoutForm
                        orderId={paymentDetails.orderId}
                        amount={paymentDetails.amount}
                        orderType={paymentDetails.orderType!}
                        address={paymentDetails.address}
                        onSuccess={handlePaymentSuccess}
                      />
                  )}
              </div>
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
                    <div className="flex justify-center gap-4 mt-6">
                        <Button size="lg" variant="outline" onClick={handleGenerateDocInvoice} disabled={!isDocAddressComplete}>
                            <FileText className="mr-2 h-5 w-5" />
                            Invoice
                        </Button>
                        <Button size="lg" disabled={isPaying || documentOrderTotal <= 0 || !isDocAddressComplete} onClick={() => handleProceedToPay('Document', documentOrderTotal)}>
                            {isPaying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShoppingCart className="mr-2 h-5 w-5" />}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Controls & Previews */}
                <div className="space-y-6">
                  <input type="file" ref={photoFileInputRef} onChange={handlePhotoFileUpload} className="hidden" accept="image/*" multiple disabled={photoOrderStep !== 'configure'} />
                  <Button variant="outline" className="w-full" onClick={() => photoFileInputRef.current?.click()} disabled={photoOrderStep !== 'configure'}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Photo(s)
                  </Button>
                  
                  {uploadedPhotos.length > 0 && (
                     <div className="space-y-2">
                        <Label>Uploaded Photos ({totalPhotoCopies} copies total)</Label>
                        <ScrollArea className="h-[40rem] w-full rounded-md border">
                          <div className="p-4 space-y-4">
                            {uploadedPhotos.map((photo) => (
                              <div key={photo.id} className="p-2 border rounded-lg">
                                <div className="flex items-start gap-4">
                                  <img src={photo.url} alt={photo.name} className="rounded-md w-20 h-20 object-cover" />
                                  <div className="flex-grow space-y-2">
                                      <p className="text-sm font-medium truncate">{photo.name}</p>
                                      <div className="flex items-center gap-2">
                                        <Label htmlFor={`width-${photo.id}`} className="text-xs">W:</Label>
                                        <Input id={`width-${photo.id}`} type="number" value={photo.width} onChange={e => handlePhotoSizeChange(photo.id, 'width', e.target.value)} className="h-8 w-20" placeholder="cm" disabled={photoOrderStep !== 'configure'}/>
                                        <Label htmlFor={`height-${photo.id}`} className="text-xs">H:</Label>
                                        <Input id={`height-${photo.id}`} type="number" value={photo.height} onChange={e => handlePhotoSizeChange(photo.id, 'height', e.target.value)} className="h-8 w-20" placeholder="cm" disabled={photoOrderStep !== 'configure'}/>
                                      </div>
                                      <div className="flex items-center">
                                         <Label htmlFor={`copies-${photo.id}`} className="text-xs mr-2">Copies:</Label>
                                         <Input
                                            id={`copies-${photo.id}`}
                                            type="number"
                                            min="0"
                                            value={photo.copies}
                                            onChange={e => handlePhotoCopyChange(photo.id, parseInt(e.target.value, 10))}
                                            className="h-8 w-20"
                                            disabled={photoOrderStep !== 'configure'}
                                         />
                                      </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleRemovePhoto(photo.id)} disabled={photoOrderStep !== 'configure'}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                  )}

                   <div className="space-y-2">
                      <Label htmlFor="paper-type">Paper Type</Label>
                      <Select value={paperType} onValueChange={setPaperType} disabled={photoOrderStep !== 'configure'}>
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
                      <Select value={photoDeliveryOption} onValueChange={setPhotoDeliveryOption} disabled={photoOrderStep !== 'configure'}>
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

                {/* Right Column: A4 Preview */}
                <div>
                   <h4 className="text-md font-semibold mb-2 text-center">A4 Page Layout Preview</h4>
                    <div className="relative">
                        {a4Preview.error ? (
                            <div className="aspect-[210/297] bg-muted/50 border-2 border-dashed rounded-md flex items-center justify-center text-destructive text-center p-4">
                                {a4Preview.error}
                            </div>
                        ) : (
                            <div className="aspect-[210/297] bg-muted/20 border-2 border-dashed rounded-md relative overflow-hidden">
                              {a4Preview.pages.length > 0 && a4Preview.pages[currentPreviewPage]?.map((photo, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-muted-foreground/20 flex items-center justify-center overflow-hidden absolute"
                                        style={{ 
                                            left: `${photo.x}px`,
                                            top: `${photo.y}px`,
                                            width: `${photo.widthPx}px`, 
                                            height: `${photo.heightPx}px` 
                                        }}
                                    >
                                      <img src={photo.url} alt="preview" className="w-full h-full object-cover"/>
                                    </div>
                              ))}
                               {a4Preview.pages.length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-muted-foreground">Photos will be arranged here</p>
                                </div>
                              )}
                            </div>
                        )}
                        {a4Preview.pages.length > 1 && (
                          <div className="flex items-center justify-center gap-4 mt-2">
                              <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setCurrentPreviewPage(p => Math.max(0, p - 1))}
                                  disabled={currentPreviewPage === 0}
                              >
                                  <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium">
                                  Page {currentPreviewPage + 1} of {a4Preview.pages.length}
                              </span>
                              <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setCurrentPreviewPage(p => Math.min(a4Preview.pages.length - 1, p + 1))}
                                  disabled={currentPreviewPage === a4Preview.pages.length - 1}
                              >
                                  <ChevronRight className="h-4 w-4" />
                              </Button>
                          </div>
                        )}
                    </div>
                </div>
              </div>
              
              <div className="mt-6">
                  <h4 className="text-md font-semibold mb-2 text-center">Photo Printing Cost</h4>
                  {photoOrderTotal > 0 ? (
                      <Table>
                          <TableBody>
                              <TableRow>
                                <TableCell>Total Number of Photo Prints</TableCell>
                                <TableCell className="text-right">{totalPhotoCopies}</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell>Printing Subtotal</TableCell>
                                  <TableCell className="text-right">Rs. {(photoOrderTotal - (deliveryCharges[photoDeliveryOption] || 0)).toFixed(2)}</TableCell>
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
                      <p className="text-center text-muted-foreground">Upload photos and set copies to see the price.</p>
                  )}
              </div>
               {photoOrderTotal > 0 && photoOrderStep === 'configure' && (
                  <div className="flex justify-center mt-6">
                    <Button size="lg" onClick={() => setPhotoOrderStep('address')} disabled={photoOrderTotal <= 0}>
                      Confirm & Proceed
                    </Button>
                  </div>
                )}
               {photoOrderStep !== 'configure' && (
                 <>
                  <Separator className="my-6" />
                  {renderAddressForm('photo', photoDeliveryAddress, handleAddressChange)}
                   <div className="flex justify-center mt-6">
                      <Button variant="outline" onClick={() => setPhotoOrderStep('configure')}>
                        Back to Configuration
                      </Button>
                    </div>
                 </>
               )}
               {isPhotoAddressComplete && photoOrderStep !== 'configure' && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-md font-semibold mb-4 text-center">Payment for Photos</h4>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button size="lg" variant="outline" onClick={handleGeneratePhotoInvoice} disabled={!isPhotoAddressComplete}>
                            <FileText className="mr-2 h-5 w-5" />
                            Invoice
                        </Button>
                        <Button size="lg" disabled={isPaying || photoOrderTotal <= 0 || !isPhotoAddressComplete} onClick={() => handleProceedToPay('Photo', photoOrderTotal)}>
                            {isPaying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShoppingCart className="mr-2 h-5 w-5" />}
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

export default function PrintDeliveryPage() {
  return (
    <ToolAuthWrapper>
      <PrintDeliveryContent />
    </ToolAuthWrapper>
  );
}
