import { Card } from "./ui/card";
import { Link } from "react-router-dom";
import { Calendar, MessageCircle, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ArticleCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
  score?: string;
}

export const ArticleCard = ({
  id,
  title,
  content,
  imageUrl,
  category,
  createdAt,
  score,
}: ArticleCardProps) => {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchCounts();
    checkIfLiked();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [id]);

  const fetchCounts = async () => {
    const { count: likes } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    const { count: comments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("article_id", id);

    setLikesCount(likes || 0);
    setCommentsCount(comments || 0);
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

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Precisa fazer login para dar like");
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

  const excerpt = content.substring(0, 150) + "...";

  return (
    <Link to={`/article/${id}`}>
      <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group cursor-pointer">
        {imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                {category}
              </span>
            </div>
            {score && (
              <div className="absolute bottom-4 right-4 bg-accent/90 backdrop-blur text-accent-foreground px-4 py-2 rounded-lg font-bold text-lg">
                {score}
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-3">{excerpt}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-1 ${isLiked ? "text-primary" : ""}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount}</span>
              </Button>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
