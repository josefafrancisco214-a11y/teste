import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Heart, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchComments();
    checkIfLiked();
    fetchLikesCount();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [id]);

  const fetchArticle = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching article:", error);
      toast.error("Erro ao carregar artigo");
      navigate("/");
    } else {
      setArticle(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("article_id", id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  };

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    setLikesCount(count || 0);
  };

  const checkIfLiked = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("likes")
      .select()
      .eq("article_id", id)
      .eq("user_id", session.user.id)
      .single();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Precisa fazer login para dar like");
      navigate("/auth");
      return;
    }

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("article_id", id)
        .eq("user_id", user.id);
      setLikesCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      await supabase
        .from("likes")
        .insert({ article_id: id, user_id: user.id });
      setLikesCount((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Precisa fazer login para comentar");
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        article_id: id,
        user_id: user.id,
        content: newComment,
      });

    if (error) {
      toast.error("Erro ao adicionar comentário");
    } else {
      toast.success("Comentário adicionado!");
      setNewComment("");
      fetchComments();
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

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <article className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto">
          {article.image_url && (
            <div className="relative h-96 rounded-xl overflow-hidden mb-8">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {article.score && (
                <div className="absolute bottom-4 right-4 bg-accent/90 backdrop-blur text-accent-foreground px-6 py-3 rounded-lg font-bold text-2xl">
                  {article.score}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold">
              {article.category}
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(article.created_at), "dd MMMM yyyy", { locale: ptBR })}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{article.title}</h1>

          <div className="flex items-center gap-4 mb-8">
            <Button
              variant={isLiked ? "default" : "outline"}
              onClick={handleLike}
              className="flex items-center gap-2"
            >
              <Heart className={isLiked ? "fill-current" : ""} />
              <span>{likesCount} Likes</span>
            </Button>
          </div>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg leading-relaxed whitespace-pre-line">{article.content}</p>
          </div>

          {/* Comments Section */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Comentários ({comments.length})
            </h2>

            {user ? (
              <form onSubmit={handleComment} className="mb-8">
                <Textarea
                  placeholder="Escreva seu comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-4"
                  rows={4}
                />
                <Button type="submit" variant="hero">
                  Comentar
                </Button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground mb-4">
                  Faça login para comentar
                </p>
                <Button variant="hero" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {comment.profiles?.full_name || comment.profiles?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), "dd MMM yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground">{comment.content}</p>
                </Card>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </Card>
        </div>
      </article>
    </div>
  );
}
