"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";

interface UpgradeProModalProps {
    title: string;
    description: string;
}

export function UpgradeProModal({ title, description }: UpgradeProModalProps) {
    return (
        <Card className="border-primary/20 bg-primary/5 text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
                <Button asChild>
                    <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
