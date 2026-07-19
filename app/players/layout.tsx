import MainLayout from "@/components/layout/MainLayout"

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}