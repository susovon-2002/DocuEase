

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
import { Printer, UploadCloud, X, CreditCard, QrCode, Wallet, HandCoins, ShoppingCart, User, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { renderPdfPagesToImageUrls } from "@/lib/pdf-utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PagePreviewDialog } from "@/components/PagePreviewDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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


export default function PrintDeliveryPage() {
  // Photo State
  const [photoWidth, setPhotoWidth] = useState('3.5');
  const [photoHeight, setPhotoHeight] = useState('4.5');
  const [photoQuantity, setPhotoQuantity] = useState('20');
  const [paperType, setPaperType] = useState('photo');
  const [photoDeliveryOption, setPhotoDeliveryOption] = useState('standard');
  const [photoPaymentMethod, setPhotoPaymentMethod] = useState('upi');
  const [photoDeliveryAddress, setPhotoDeliveryAddress] = useState(initialAddressState);

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

    const logoPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAXVBMVEX///8zms0WlssAk8sAmcwhlcxKnM4+m84wlsv2/f4e+v4X+P4n+v4O+f4AksgAl8sAm8wYl8xcl81ums1CoM5opc9rs9B5vNGEw9OJxdWPytmXztq33u3A5O/a7/bV7PXi8/gK+P0hR5GdAAADJ0lEQVR4nO2byXKaMBBGIQiU2IAsIoqgoPf//7ZbU6hEBIp1JJOec+yE5DIhQ3s6UwcJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJiQ8I+z6s+qS4S2WjW5xN/yf1oD+2T4s/VvWn4utjQ6Y9sHymLgqyqJ1Nrd2Z8mXlZFn1U3K7e9P6wFq9z4g2k2W+uA8N7c3p7e3k3fLwzEun4+bWc+v1q23xMvFq9Nq/bN6v36N2/Sj4cvHq9v15Pnz6/aC/vP7x6v35dO3r8Sfnz8fPj5+O/j58eP//89fv/59f/j8+f/v9++/fn9/ffj3/c//n/f8/f3v/5/P3/f+ffz98v/+38c/X/4e/fn+/ffn788fD35e/Tq+fnh69Obx/f3t7f3l5fXl5e3t7eXj48/D35+Pnz59/P38/e/fj79+/nz99/fPz99+//v1+f/f75+/vz5+/vv39//P3z9/f3z9//fv7+/f//98fP3z8fvn6/f/35/fv/98v375+f37+e/v/6/f379/e/P35+v//+f/r98/f/nx//P35//+fz9+/f//59/v/z5//P/3/+/fP3/5+v379//f79+ff/36/fv79+//v1+/fv39+//v1+/fv/79+//v1+/f/n98/fv7+/fP3/9+//v1+//vz9/fv/79+//v1+//vz9//fv7+/fP3/9+/f//79+/f//79+//v37+//vz5+/f/379+//v1+/f/3+///35+//vz9///379//fr9+//v1+/fnz9+/fv/79+//v1+///35+//v35+//f75+//P3/9///79/ffv3+/fv36/f/36/fv/5/ff7+/f/v+///36/fv/5+/f/v+///v1+///r9+ff79+/fv7/9/ff/98/f//5+//vz5+fnz4/f/35+/vP399eHt7eXh48PDw8ODg/fPl+/ff75+ff79/ff3r9+/fv75/f/39+fnz58f/n38+/vz//vvv5+/f/z5+v35+/v31+v1+//n19efn78+f/z6+ffx49fPz99fP//4f+7/2P+n/kP/o/4f+f/if5T/s/7P/T/5//n/w8PD/z8f3r9/ff/7++/vnz+//vz5+/vv39/f/v75+///75+//vz5+//v35+//vz9+/fr9+/fv35///X79+//v1+//v1+//v35+ff/n+/f/n9+ff/3+/fn78+ff/z+/fPz/9+/P378+/fPz+/fn79/f/3+///75+v/v78+///37+///75+fn7+/vnz5+//n38+fPj1+/P37+/vz5+/f7+9vb28vLx8f3j6//P35+//P31+///79//f7z+/f3z8fPz4fvnw+fPz/f//59+/vz8/v728vLx8fHp+fnl9fX15eXp+fnx8fHx8fPz89Pby8vH98+f7/f/728//H589//Pz9//H/+8/f/j/8fP//8/f/z+///r9//P7++//f3z//P/z9//Pn3/+P//5+v//8+ffz/9+/v/+9+//n3/+//j1+/P/x+/Pn3/+Pnz/9fr969f/j1//Pr9+ffr/+/vP75+///1/fP3/9+/v7/+/vvz+/vz5+//n3++f/37/fv7+/vP3z+/vr6+vr59/f31+///78///1/e//3+8///7+///7+///7+///z59//n9+/f/5//fP7/+/v3z9/f/n+/fn75+/f7+8ffn78+/v/+vby8/f3l7ffn9/ev31+f/v98+/vn5+vHz/ePl4+Xj4f3v+/fXz89/P/54f/+ffv17ePl2/fvv36+vPz5/P/p5e3j/dv377+/vr6+uP3z+ffvx8/Pv//9frz+9f3n18//vz9+vr5+/P768/f339//f35//Pz19f//z98/fn9+/f3n1+/Pr5+/vn/9e7z5/eP7x/ev/77f//z7eXj/fvn+/fP7+/vf19fX16+v7/dv/x+/P/z9+/nz8+fr1/e/f3x9/PHz7fPn+8fL96/X71+f/r59f/n9+vr15+vr9+/vz6/v3r+v3/68vD18vXx8fr5++fP37+fvnz/fP718P39+f799+/X/49/vX1+vb18vb28fD99/fv37ffP72+3z7f/n1+/fX95ev716vPr+/PHz9evb58fb+/f/+9fL9/vb+/v//99vb99/fPt49fb59fL1//Pr59vbx9vHz9+fX2/vXz69vLz/fPl6+Pr9+/Xz+/Xn98fPl48fLx8PX16eHt4enp8eHp68fr16vPr59fX2+vb5+vHy8e718vb18vbz/fvr7ev3y/fX78/P31+/vrz+/vz9+fr5+/Pn5//+///r18fXx8vHz8/3t8+Xr5ffv3/ffnx7fbt+/f3z8/v/399vr28fHx6+frz++vby8PT9+/X39/vb19vbz8fHx7e/v+ffX58+vr/9///n9+/P318/vn69/3/8//f/r9+vP79+/Pz8+3v68vX18vL6+vr6+/vr7e3z+/vP39+fr19evnx9fHx8vHx8vb18vr68/X14+fnx/+/fP1/+/vz+/vP1/9//79/ev15+vPz49vbx8vny+fr1+ff/z9/vr9+fvz7+fPz7+/vn+ff/78+v3x4eHx6eHp6eHp68frx+v7x8vbz9fn/7ePl4/Xr1+/Prx8vny9fby+vb1+/Pn5/vb7+vPx6f7t+/fby/vP5+/Px/ffb1/efrx+vb1/vny/f76/ff759vb58eHh6eHx8fHx8fHx6eHx8eHx8eHx6eHx6eHx6eHx6eHp6eHl5eXj5eH18fH68vb59vr2/f7x8vny+f7x+vHx8fn+8/ny+fP99v3y/fbz+fby8vLw8PHx+fbz+fbz+fbz8vHy8fHy8fHx8fHx8fHy+vHy+vHy8/Xp+fHp6fHx6fny8fLy8vLz8fH19vb58vX68vny9fHx6enp+fHx8fHx8fHx8fnx8fHx8fHx8fHx8fHx8fHy8fHy8fHx8vHx8fny8/X5+vXy8vLy8vLy8vLy8vLy8fny8/Xy+vHx8vHx8fnx8fnp+fnx8fnx+fnx+fHx+fHx+fHx+fnx8fnp+fnp+fnx8fnp+fnx8fHx8fHx8fHx8fHx8fnx+fnx8fHx8fHx8fnp+fHx8fHx8fHx8fHx8fHx8fnp+fnp+fnx8fnp+fnx+fHx+fHx+fnx8fnp+fHx+fnx+fHx8fnp+fnp+fnp8fnp+fnp+fnp+fnp+fnx8fHx+fnx8fnp+fnp+fHx+fnx8fnp+fnp+fnp+fnp+fnx8fnx+fnx8fnx8fnp+fnp+fnp8fnx+fnp+fnp8fnp+fnp+fnx8fnx+fnx8fnx8fnp+fnp+fnp+fnp8fnp+fnp8fnp+fnp+fnp+fnx8fnx+fnx8fnx8fnp+fnp+fnx+fnx8fnx+fnp+fnp+fnx8fHx+fnx+fnx8fnx+fnp+fnp+fnp8fnp+fnp8fnp+fnx+fnx8fHx+fnx+fnp+fnp+fnx8fHx+fHx8fnp+fnp+fnx8fnx+fnx8fnx+fnp+fnp+fnx8fnx+fnx+fnp+fnx8fHx+fnp+fnx8fHx+fnp+fnx+fHx+fnp+fnp+fnp+fnp+fnx8fHx8fnp+fnp+fnx8fHx8fnx8fHx+fHx+fnx8fHx+fnx8fnx+fHx+fHx+fnx8fHx+fnx8fHx+fHx+fnx8fHx+fnx8fnx+fnp+fnp+fnp+fnp+fnp8fnp+fnx8fHx+fnx8fnp+fnp+fnx8fHx+fHx8fHx+fnx+fHx+fnp+fnp+fnx8fnp+fnp+fnp+fnx+fnx+fnx+fnx8fnx8fnp+fnp+fnp+fnx8fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnp+fnp+fnx+fHx+fHx+fHx+fnp+fnx8fnp+fnp+fnp+fnx+fnp+fnx8fnp+fnp+fnx+fnp+fnx+fnx8fHx+fnx+fnx8fnx8fnp+fnx+fnx+fnx+fnx+fnx+fnp+fnp+fnx8fnp+fnx+fnx8fnx+fnx+fnx8fnp+fnx+fnx+fnx8fnp+fnx+fnp+fnx+fnp+fnx+fnx8fnx+fnx+fnx8fnp+fnx+fnx8fHx+fnx+fnx+fnx8fnx+fnx+fnx+fnx8fnx8fnx+fnp+fnx+fnp+fnx8fHx+fHx+fnx+fnx+fnx8fnp+fnx+fHx+fnx+fnx+fnx+fnx+fnp+fnx8fnp+fnx8fnp+fHx+fnx8fnx+fHx+fnx8fnx+fnx+fnx+fnx+fnp+fnx8fnx+fnx+fHx+fnx+fnx+fHx+fHx+fnx+fHx+fnx+fnx8fnx+fnx+fnx+fnx+fHx+fnx8fnx+fnx+fnx+fnx+fnx+fnx8fnx+fnp+fnx8fnx+fnx8fnx+fnx+fnx+fnx+fnp+fnx+fnp+fnp+fnx8fnx+fnx+fnp+fnp+fnx+fnp+fnx8fnx8fnx+fnx+fnp+fnp+fnx8fHx+fnx8fHx+fnx+fnp+fnp+fnx+fHx+fnx+fHx+fnp+fnx+fnx+fHx+fnx+fHx+fnx8fnx+fnx+fHx+fnx+fHx+fHx+fnx+fHx+fnx+fHx+fnx+fnx+fnx8fnx+fnx+fHx+fnx+fHx+fHx+fHx+fnp+fnp+fnx+fnx+fnx+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnx+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnp+fnx+fnx+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnp+fnx+fnp+fnx+fnp+fnx+fnp+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnx+fnp+fnx+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnp+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnp+fnx+fnx+fnp+fnp+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnp+fnx+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnx+fnx+fnx+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnx+fnp+fnx+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnp+fnp+fnp+fnx+fnx+fnx+fnx+fnp+fnp+fnp+fnp+fnp+fnp+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnp+fnx+fnp+fnx+fnx+fnp+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnp+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fnx+fn-CgkJCcne/wM5M6B+XpA7WAAAAABJRU5ErkJggg==';
    const imageBytes = await fetch(`data:image/png;base64,${logoPngBase64}`).then(res => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(imageBytes);

    const logoDims = logoImage.scale(0.25);

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: primaryColor,
    });
    page.drawImage(logoImage, {
      x: 50,
      y: height - 85,
      width: logoDims.width,
      height: logoDims.height,
    });
    page.drawText('DocuEase', {
      x: 50 + logoDims.width + 10,
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
    page.drawRectangle({ x: 0, y: 0, width, height: 60, color: lightGrayColor });
    page.drawText('Thank you for your business!', { x: 50, y: 30, font: boldFont, size: 12, color: grayColor });
    page.drawText('www.docuease.com | contact@docuease.com', { x: 350, y: 30, font: font, size: 9, color: grayColor });


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
      quantity: parseInt(photoQuantity, 10),
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
      <Card className="max-w-4xl mx-auto">
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
                        <Button size="lg" disabled={documentOrderTotal <= 0 || !isDocAddressComplete}>
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
              <h3 className="text-xl font-semibold mb-4 text-center">Photo Printing</h3>
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
                              <SelectItem value="matte">Matte (+Rs. 1/photo)</SelectItem>
                              <SelectItem value="glossy">Glossy (+Rs. 2/photo)</SelectItem>
                              <SelectItem value="premium">Premium Luster (+Rs. 3/photo)</SelectItem>
                              <SelectItem value="hd">HD Paper (+Rs. 4/photo)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
               <div className="space-y-2 mt-6">
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
              
              <div className="mt-6">
                  <h4 className="text-md font-semibold mb-2 text-center">Photo Printing Cost</h4>
                  {photoPrice.error ? (
                      <p className="text-center text-red-500 font-medium">{photoPrice.error}</p>
                  ) : photoPrice.printingCost > 0 ? (
                      <Table>
                          <TableBody>
                              <TableRow>
                                  <TableCell>Price per Photo</TableCell>
                                  <TableCell className="text-right">Rs. {photoPrice.pricePerPhoto.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell>Printing Subtotal ({photoQuantity} photos)</TableCell>
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
                      <p className="text-center text-muted-foreground">Enter dimensions and quantity to see the price.</p>
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
                        <Button size="lg" disabled={photoOrderTotal <= 0 || !isPhotoAddressComplete}>
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
