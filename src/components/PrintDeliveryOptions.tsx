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
import { Printer } from "lucide-react";

const printOptions = [
  { item: "Black & White Print", cost: "₹3 / page" },
  { item: "Color Print", cost: "₹5 / page" },
  { item: "Glossy Photo Paper", cost: "+ ₹2 / photo (Basic plan & above)" },
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printOptions.map((option) => (
              <TableRow key={option.item}>
                <TableCell className="font-medium">{option.item}</TableCell>
                <TableCell className="text-right">{option.cost}</TableCell>
              </TableRow>
            ))}
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
      </CardContent>
    </Card>
  );
}
