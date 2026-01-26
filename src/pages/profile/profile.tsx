import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export const ProfileSection = () => {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>

                {/* Informações Pessoais */}
                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user?.photo} />
                                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <Button variant="outline">Alterar Foto</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Nome</label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Email</label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <Button className="mt-4">Salvar alterações</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Segurança */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Senha atual</label>
                                <Input type="password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nova senha</label>
                                <Input type="password" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Confirmar nova senha</label>
                                <Input type="password" />
                            </div>
                            <Button className="mt-4">Alterar senha</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
