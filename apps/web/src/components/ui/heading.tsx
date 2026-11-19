interface HeadingProps {
  title: string;
  description: string;
}

export function Heading({ title, description }: HeadingProps) {
  return (
    <div className='min-w-0'>
      <h1 className='font-heading text-2xl font-semibold tracking-tight text-balance'>{title}</h1>
      <p className='text-muted-foreground mt-1 text-sm text-pretty'>{description}</p>
    </div>
  );
}
