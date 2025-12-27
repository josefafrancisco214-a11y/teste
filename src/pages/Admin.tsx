import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    category: "Futebol",
    author_name: "",
    match_date: "",
    score: "",
  });

  useEffect(() => {
    checkAuth();
    fetchArticles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("articles").insert({
      ...formData,
      match_date: formData.match_date || null,
      score: formData.score || null,
    });

    if (error) {
      toast.error("Erro ao criar artigo");
      console.error(error);
    } else {
      toast.success("Artigo criado com sucesso!");
      setFormData({
        title: "",
        content: "",
        image_url: "",
        category: "Futebol",
        author_name: "",
        match_date: "",
        score: "",
      });
      setShowForm(false);
      fetchArticles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar este artigo?")) return;

    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar artigo");
    } else {
      toast.success("Artigo eliminado!");
      fetchArticles();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Painel Admin</h1>
          <Button variant="hero" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Notícia
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Futebol">Futebol</SelectItem>
                      <SelectItem value="Basquetebol">Basquetebol</SelectItem>
                      <SelectItem value="Andebol">Andebol</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="author_name">Autor</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) =>
                      setFormData({ ...formData, author_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match_date">Data do Jogo (opcional)</Label>
                  <Input
                    id="match_date"
                    type="datetime-local"
                    value={formData.match_date}
                    onChange={(e) =>
                      setFormData({ ...formData, match_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="score">Resultado (opcional)</Label>
                  <Input
                    id="score"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({ ...formData, score: e.target.value })
                    }
                    placeholder="ex: 2 - 0"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" variant="hero">
                  Publicar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-2xl font-bold">Artigos Publicados</h2>
          {articles.map((article) => (
            <Card key={article.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                  <p className="text-muted-foreground mb-2">
                    {article.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {article.category}
                    </span>
                    <span>por {article.author_name}</span>
                    {article.score && <span>Resultado: {article.score}</span>}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(article.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {articles.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum artigo publicado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
