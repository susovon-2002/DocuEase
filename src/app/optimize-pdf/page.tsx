import { OptimizePdfClient } from './OptimizePdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function OptimizePdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <OptimizePdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
