mod interface;

use crate::interface::App;
use color_eyre::{
    // eyre::{bail, WrapErr},
    Result,
};

fn main() -> Result<()> {
    color_eyre::install()?;
    let mut terminal = ratatui::init();
    let app_result = App::default().run(&mut terminal);
    ratatui::restore();
    app_result
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::io;
    use ratatui::{
        style::Style,
        style::Stylize,
        prelude::Rect,
        prelude::Buffer,
        widgets::Widget,
    };
    use crossterm::event::KeyCode;

    #[test]
    fn render() {
        let app = App::default();
        let mut buf = Buffer::empty(Rect::new(0, 0, 50, 4));

        app.render(buf.area, &mut buf);

        let mut expected = Buffer::with_lines(vec![
            "┏━━ToolBox - Table Extraction | Version 0.0.1 ━━━┓",
            "┃               Testing Interface                ┃",
            "┃                                                ┃",
            "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
        ]);
        let title_style = Style::new().bold();
        let text_style = Style::new().yellow();
        expected.set_style(Rect::new(14, 0, 22, 1), title_style);
        expected.set_style(Rect::new(28, 1, 1, 1), text_style);

        assert_eq!(buf, expected);
    }

    #[test]
    fn handle_key_event() -> io::Result<()> {
        let mut app = App::default();
        app.handle_key_event(KeyCode::Char('q').into());
        assert!(app.exit);

        Ok(())
    }
}
