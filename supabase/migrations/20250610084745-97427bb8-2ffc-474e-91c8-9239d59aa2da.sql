
-- Add PDF upload column type to the enum
ALTER TYPE column_type ADD VALUE 'pdf_upload';

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-uploads', 'pdf-uploads', true);

-- Create basic RLS policies for the PDF uploads bucket
CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete their own PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pdf-uploads' AND
  auth.role() = 'authenticated'
);
