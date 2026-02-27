import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "../components/ui/label"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

const SignInSchema = z.object({
      username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
      password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export function SigninForm({
      className,
      ...props

}: React.ComponentProps<"div">) {
      return (
            <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
                  <div className={cn("w-full max-w-4xl px-4", className)} {...props}>
                        <Card className="overflow-hidden p-0">
                              <CardContent className="grid p-0 md:grid-cols-2">
                                    <form className="p-6 md:p-8">
                                          <FieldGroup>
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                      <h1 className="text-2xl font-bold">Login to your account</h1>

                                                </div>

                                          </FieldGroup>

                                    </form>

                              </CardContent>

                        </Card>
                  </div>

            </div>
      )
}
