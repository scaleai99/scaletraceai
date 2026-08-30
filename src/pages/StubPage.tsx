interface StubPageProps {
  title: string
  description?: string
}

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      {description && (
        <p className="text-sm text-gray-500 mb-6">{description}</p>
      )}
      <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
        <p className="text-gray-400 text-sm">Module under construction</p>
      </div>
    </div>
  )
}
