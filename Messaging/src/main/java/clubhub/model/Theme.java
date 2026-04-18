package clubhub.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Theme {
    private String name;
    private String primaryColor;
    private String accentColor;
    private String bubbleColor;
    private String backgroundColor;
    @JsonProperty("isGradient")
    private boolean isGradient;
    private String gradientEndColor;
    private String backgroundImageUrl;

    public Theme(String classicBlue, String hashtag, String hashtag1, String hashtag2, String hashtag3, boolean b, Object o) {
    }
}